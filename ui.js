(function () {
  if (typeof Vue === "undefined" || typeof document === "undefined")
    return;
  const app = Vue.createApp({
    data() {
      return {
        form: loadForm(),
        status: "Ожидание",
        error: "",
        busy: false,
        connected: false,
        connectionDialogOpen: true,
        activeTab: "topics",
        locations: [],
        expandedLocations: {},
        currentLocationId: null,
        view3dError: "",
        project: null,
        unpacked: [],
        topics: [],
        filter: "",
        kind: "all",
        log: [],
        sessionId: "",
        clientId: "",
        brokerUrl: "",
        topicIndex: new Map()
      };
    },
    computed: {
      kinds() {
        const set = new Set(this.topics.map((t) => t.kind));
        return Array.from(set);
      },
      visibleTopics() {
        const q = this.filter.trim().toLowerCase();
        return this.topics.filter((row) => {
          if (this.kind !== "all" && row.kind !== this.kind)
            return false;
          if (!q)
            return true;
          return (row.topic + " " + row.entity + " " + row.type + " " + row.field).toLowerCase().indexOf(q) >= 0;
        });
      },
      commandPrefix() {
        if (!this.project || !this.sessionId)
          return "";
        return "Jocket/Command/" + this.project.id + "/" + this.sessionId + "/";
      },
      locationTree() {
        const nodes = new Map(this.locations.map((location) => [
          String(location.id),
          { location: location, children: [], parent: null }
        ]));

        for (const location of this.locations) {
          const parent = nodes.get(String(location.id));
          for (const model of location.models || []) {
            for (const transition of model.transitions || []) {
              if (transition.sameLevel)
                continue;
              const child = nodes.get(String(transition.locationID));
              if (!child || child === parent || child.parent)
                continue;
              child.parent = parent;
              parent.children.push(child);
            }
          }
        }

        const byTitle = (a, b) => this.locationTitle(a.location)
          .localeCompare(this.locationTitle(b.location), "ru");
        nodes.forEach((node) => node.children.sort(byTitle));

        const roots = Array.from(nodes.values()).filter((node) => !node.parent).sort(byTitle);
        const rootId = this.project && this.project.rootLocationID;
        const rootIndex = roots.findIndex((node) => node.location.id === rootId);
        if (rootIndex > 0)
          roots.unshift(roots.splice(rootIndex, 1)[0]);
        return roots;
      },
      visibleLocationNodes() {
        const result = [];
        const visited = new Set();
        const append = (node, depth) => {
          const key = String(node.location.id);
          if (visited.has(key))
            return;
          visited.add(key);
          result.push({ location: node.location, children: node.children, depth: depth });
          if (this.isLocationExpanded(node.location.id))
            node.children.forEach((child) => append(child, depth + 1));
        };
        this.locationTree.forEach((root) => append(root, 0));
        return result;
      }
    },
    watch: {
      activeTab(value) {
        if (value === "view3d")
          this.$nextTick(() => this.initThreeView());
      }
    },
    methods: {
      saveForm() {
        try {
          const copy = Object.assign({}, this.form);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
        } catch (e) {}
      },
      onFile(event) {
        const file = event.target.files && event.target.files[0];
        this.form.fileName = file ? file.name : "";
        this._file = file || null;
      },
      setStatus(text) {
        this.status = text;
        this.error = "";
      },
      fail(text) {
        this.error = String(text || "Ошибка");
        this.status = "Ошибка";
        this.busy = false;
      },
      pushLog(topic, value) {
        const at = new Date().toLocaleTimeString();
        this.log.unshift({ topic: topic, value: value, at: at });
        if (this.log.length > 40)
          this.log.pop();
      },
      indexTopics() {
        this.topicIndex = new Map(this.topics.map((row) => [row.topic, row]));
      },
      applyProject(project) {
        this.project = {
          id: project.id,
          name: project.name,
          cloudCode: project.cloudCode,
          rootLocationID: project.rootLocationID,
          engineries: project.engineries.length,
          subgineries: project.subgineries.length,
          managers: project.managers.length,
          providers: project.providers.length
        };
        this.unpacked = project.files;
        this._model = project;
        this.locations = project.locations.slice();
        this.expandedLocations = Object.fromEntries(
          this.locations.map((location) => [String(location.id), true])
        );
        this.currentLocationId = null;
        this.view3dError = "";
        this.topics = buildEntityTopics(project);
        this.indexTopics();
      },
      initThreeView() {
        if (this._threeView || !this._model)
          return;
        try {
          const container = document.getElementById("three-view-container");
          this._threeView = new ProjectThreeView(container, this._model);
          const rootId = this._model.rootLocationID;
          const first = this.locations.find((location) =>
            location.id === rootId && location.arrangements && location.arrangements.length
          ) || this.locations.find((location) =>
            location.arrangements && location.arrangements.length
          );
          if (first) {
            this.currentLocationId = first.id;
            this._threeView.goToLocation(first.id, false);
          }
        } catch (e) {
          this.view3dError = e && e.message ? e.message : String(e);
          console.error(e);
        }
      },
      selectLocation(locationId) {
        if (this._threeView && this._threeView.goToLocation(locationId, true))
          this.currentLocationId = locationId;
      },
      locationTitle(location) {
        return location.title || location.label ||
          String(location.name || "").replace(/\*$/, "") ||
          ("Локация " + location.id);
      },
      isLocationExpanded(locationId) {
        return this.expandedLocations[String(locationId)] !== false;
      },
      toggleLocation(locationId) {
        const key = String(locationId);
        this.expandedLocations[key] = !this.isLocationExpanded(locationId);
      },
      async readSource() {
        if (this.form.source === "file") {
          if (!this._file)
            throw new Error("Выберите файл проекта .ctp");
          this.setStatus("Чтение файла");
          const buf = await this._file.arrayBuffer();
          return new Uint8Array(buf);
        }
        if (this.form.source === "cloud") {
          const url = cloudUrl(this.form.cloudCode.trim());
          this.brokerUrl = url;
          this.setStatus("Загрузка из Т-Облака");
          const res = await fetch(url);
          if (!res.ok)
            throw new Error("Т-Облако ответило " + res.status);
          return new Uint8Array(await res.arrayBuffer());
        }
        return null;
      },
      async downloadProject() {
        const host = this.form.host.trim();
        if (!host)
          throw new Error("Укажите IP или имя сервера");
        const url = projectDownloadUrl(this.form);
        this.brokerUrl = url;
        this.setStatus("Загрузка проекта");
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok)
          throw new Error("Сервер ответил " + res.status + " на загрузку проекта");
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b)
          throw new Error("Сервер прислал не архив проекта");
        return bytes;
      },
      showServiceTopics() {
        const extra = serviceTopics(this.project.id, this.sessionId);
        const known = new Set(this.topics.map((row) => row.topic));
        extra.forEach((row) => {
          if (!known.has(row.topic))
            this.topics.unshift(row);
        });
        this.indexTopics();
      },
      stateText(value) {
        if (value !== null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value"))
          return this.stateText(value.value);
        if (value !== null && typeof value === "object")
          return JSON.stringify(value);
        return String(value);
      },
      applyState(rows, data) {
        if (!this.connected || data === null || data === undefined || typeof data !== "object")
          return;
        const at = new Date().toLocaleTimeString();
        rows.forEach((row) => {
          if (!Object.prototype.hasOwnProperty.call(data, row.field))
            return;
          const text = this.stateText(data[row.field]);
          if (row.value !== text) {
            row.value = text;
            row.at = at;
            this.pushLog(row.topic, text);
          }
        });
      },
      async fetchState(key, rows) {
        const url = httpOrigin(this.form) + "/proxy/v1/state?topic=" + encodeURIComponent(key);
        const res = await fetch(url);
        if (!res.ok)
          return;
        this.applyState(rows, await res.json());
      },
      async pollStates() {
        if (this._polling || !this.connected)
          return;
        this._polling = true;
        try {
          const groups = new Map();
          this.topics.forEach((row) => {
            const key = proxyTopic(row.topic);
            if (!key)
              return;
            if (!groups.has(key))
              groups.set(key, []);
            groups.get(key).push(row);
          });
          const keys = Array.from(groups.keys());
          let index = 0;
          const worker = async () => {
            while (index < keys.length && this.connected) {
              const key = keys[index++];
              try {
                await this.fetchState(key, groups.get(key));
              } catch (e) {}
            }
          };
          await Promise.all([worker(), worker(), worker()]);
        } finally {
          this._polling = false;
        }
      },
      startPoll() {
        this.stopPoll();
        this.connected = true;
        this.brokerUrl = httpOrigin(this.form);
        const tick = () => { this.pollStates(); };
        tick();
        this._timer = setInterval(tick, 10000);
      },
      stopPoll() {
        this.connected = false;
        if (this._timer) {
          clearInterval(this._timer);
          this._timer = 0;
        }
      },
      async connect() {
        this.busy = true;
        this.error = "";
        this.log = [];
        this.stopPoll();
        this.setStatus("Подключение");
        try {
          this.saveForm();
          const bytes = this.form.source === "server"
            ? await this.downloadProject()
            : await this.readSource();
          this.setStatus("Распаковка проекта");
          const project = unpackCtp(bytes);
          this.applyProject(project);
          this.sessionId = uuidBraced();
          this.clientId = "";
          this.showServiceTopics();
          if (this.form.host.trim())
            this.startPoll();
          this.setStatus("Подключено");
          this.activeTab = "topics";
          this.connectionDialogOpen = false;
          this.busy = false;
        } catch (e) {
          this.fail(e && e.message ? e.message : e);
          this.stopPoll();
        }
      },
      async disconnect() {
        this.busy = true;
        this.stopPoll();
        if (this._threeView) {
          this._threeView.dispose();
          this._threeView = null;
        }
        this.project = null;
        this.topics = [];
        this.locations = [];
        this.expandedLocations = {};
        this.currentLocationId = null;
        this.view3dError = "";
        this.unpacked = [];
        this.topicIndex = new Map();
        this.brokerUrl = "";
        this.log = [];
        this.activeTab = "topics";
        this.connectionDialogOpen = true;
        this.setStatus("Отключено");
        this.busy = false;
      }
    }
  });

  try {
    app.mount("#app");
  } catch (e) {
    console.error(e);
    const note = document.createElement("p");
    note.className = "error";
    note.textContent = "Не удалось запустить интерфейс: " + (e && e.message ? e.message : e);
    document.body.prepend(note);
  }
})();
