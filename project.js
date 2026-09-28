/* Jocket web client: file, T-Cloud, and broker. No auth, no Tros3, no Spread. */
(function () {
  const STORAGE_KEY = "jocket-web-connection";

  function loadForm() {
    try {
      return Object.assign(defaultForm(), JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (e) {
      return defaultForm();
    }
  }

  function defaultForm() {
    return {
      source: "server",
      host: "",
      port: 1883,
      webPort: 80,
      user: "",
      password: "",
      ssl: false,
      cloudCode: "",
      fileName: ""
    };
  }

  function uuidBraced() {
    const raw = (crypto.randomUUID && crypto.randomUUID()) || fallbackUuid();
    return "{" + raw + "}";
  }

  function fallbackUuid() {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }

  function clientId() {
    const b = crypto.getRandomValues(new Uint8Array(4));
    return "QTrogl" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  }

  function cloudUrl(code) {
    if (!/^\d{12}$/.test(code))
      throw new Error("Код Т-Облака — 12 цифр");
    let sum = 0;
    for (const ch of code)
      sum += Number(ch);
    const base = ["https://throne.systems/storage/", "https://beta.throne.systems/storage/", "https://alpha.throne.systems/storage/"][sum % 10];
    if (!base)
      throw new Error("Код Т-Облака не подходит ни к одному хранилищу");
    return base + code + ".ctp";
  }

  function textOf(files, name) {
    const key = Object.keys(files).find((k) => k === name || k.endsWith("/" + name));
    if (!key)
      return null;
    return new TextDecoder("utf-8").decode(files[key]);
  }

  function readList(files, fileName, key) {
    const raw = textOf(files, fileName);
    if (!raw)
      return [];
    const doc = JSON.parse(raw);
    const list = doc[key];
    if (!Array.isArray(list))
      throw new Error(fileName + " не содержит массив " + key);
    return list;
  }

  function unpackCtp(bytes) {
    if (!globalThis.fflate)
      throw new Error("Не загружена библиотека распаковки");
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (data.length < 4 || data[0] !== 0x50 || data[1] !== 0x4b)
      throw new Error("Файл проекта не является zip-архивом .ctp");
    let files;
    try {
      files = fflate.unzipSync(data);
    } catch (e) {
      throw new Error("Не удалось распаковать проект: " + (e && e.message ? e.message : e));
    }
    const headerRaw = textOf(files, "header.json");
    if (!headerRaw)
      throw new Error("В архиве нет header.json");
    const header = JSON.parse(headerRaw);
    const project = (header.header && header.header.project) || header.project || {};
    if (project.id === undefined || project.id === null)
      throw new Error("В header.json нет project.id");
    return {
      files: Object.keys(files).sort(),
      id: project.id,
      name: project.title || project.name || ("Проект " + project.id),
      cloudCode: project.cloudCode || "",
      rootLocationID: project.rootLocationID,
      models: readList(files, "models.json", "models"),
      engineries: readList(files, "engineries.json", "engineries"),
      subgineries: readList(files, "subgineries.json", "subgineries"),
      servers: readList(files, "servers.json", "servers"),
      managers: readList(files, "managers.json", "managers"),
      providers: readList(files, "providers.json", "providers"),
      locations: readList(files, "locations.json", "locations")
    };
  }

  function entityLabel(item) {
    return item.name || item.label || item.title || ("id " + item.id);
  }

  function pushTopics(list, seen, topic, row) {
    if (seen.has(topic)) {
      const prev = seen.get(topic);
      if (row.entity && prev.entity.indexOf(row.entity) < 0)
        prev.entity += ", " + row.entity;
      return;
    }
    const full = Object.assign({
      topic: topic,
      kind: "",
      entity: "",
      type: "",
      field: "",
      value: "",
      at: ""
    }, row);
    seen.set(topic, full);
    list.push(full);
  }

  function fieldsFor(group, type) {
    const map = JOCKET[group] || {};
    const fields = map[type];
    return fields && fields.length ? fields : ["#"];
  }

  function buildEntityTopics(project) {
    const list = [];
    const seen = new Map();
    const pid = project.id;
    const locations = new Map((project.locations || []).map((l) => [l.id, entityLabel(l)]));

    for (const item of project.engineries || []) {
      if (!item.type || item.id === undefined)
        continue;
      for (const field of fieldsFor("enginery", item.type)) {
        const topic = field === "#"
          ? "Jocket/State/" + pid + "/Equipment/" + item.type + "/" + item.id + "/#"
          : "Jocket/State/" + pid + "/Equipment/" + item.type + "/" + item.id + "/" + field;
        pushTopics(list, seen, topic, {
          kind: "Инженерия",
          entity: entityLabel(item),
          type: item.type,
          field: field
        });
      }
    }

    for (const item of project.subgineries || []) {
      if (!item.type)
        continue;
      const devId = item.locationID !== undefined && item.locationID !== null && item.locationID >= 0
        ? item.locationID : item.id;
      const locName = locations.get(devId);
      const label = entityLabel(item) + (locName ? " · " + locName : "");
      for (const field of fieldsFor("subginery", item.type)) {
        const topic = field === "#"
          ? "Jocket/State/" + pid + "/Equipment/" + item.type + "/" + devId + "/#"
          : "Jocket/State/" + pid + "/Equipment/" + item.type + "/" + devId + "/" + field;
        pushTopics(list, seen, topic, {
          kind: "Сабджинерия",
          entity: label,
          type: item.type,
          field: field
        });
      }
    }

    const managers = new Map((project.managers || []).map((m) => [m.id, m]));
    for (const item of project.managers || []) {
      if (!item.type || item.serverID === undefined)
        continue;
      for (const field of fieldsFor("manager", item.type)) {
        const tail = "Jocket/State/" + pid + "/Hardware/AppServer/" + item.serverID + "/" + item.type + "/" + item.id;
        const topic = field === "#" ? tail + "/#" : tail + "/" + field;
        pushTopics(list, seen, topic, {
          kind: "Менеджер",
          entity: entityLabel(item),
          type: item.type,
          field: field
        });
      }
    }

    for (const item of project.providers || []) {
      const manager = managers.get(item.managerID);
      if (!item.type || !manager || manager.serverID === undefined)
        continue;
      for (const field of fieldsFor("provider", item.type)) {
        const tail = "Jocket/State/" + pid + "/Hardware/AppServer/" + manager.serverID + "/" +
          manager.type + "/" + manager.id + "/" + item.type + "/" + item.id;
        const topic = field === "#" ? tail + "/#" : tail + "/" + field;
        pushTopics(list, seen, topic, {
          kind: "Провайдер",
          entity: entityLabel(item),
          type: item.type,
          field: field
        });
      }
    }

    return list;
  }

  function serviceTopics(projectId, sessionId) {
    return [
      { topic: "Jocket/State/" + projectId + "/Equipment/#", kind: "Подписка", entity: "Состояние инженерии", type: "Jocket", field: "#" },
      { topic: "Jocket/State/" + projectId + "/Hardware/#", kind: "Подписка", entity: "Состояние аппаратуры", type: "Jocket", field: "#" },
      { topic: "Jocket/Reply/" + projectId + "/" + sessionId + "/#", kind: "Подписка", entity: "Ответы сессии", type: "Jocket", field: "#" },
      { topic: "Project/" + projectId + "/Local/Preset/#", kind: "Подписка", entity: "Пресеты", type: "Project", field: "#" },
      { topic: "Project/" + projectId + "/Hash", kind: "Подписка", entity: "Хеш проекта", type: "Project", field: "Hash" }
    ].map((row) => Object.assign({ value: "", at: "" }, row));
  }

  function formatPayload(payload) {
    const bytes = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
    if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b)
      return "zip, " + bytes.length + " байт";
    const text = new TextDecoder().decode(bytes);
    try {
      return JSON.stringify(JSON.parse(text));
    } catch (e) {
      return text;
    }
  }

  function httpOrigin(form) {
    const scheme = form.ssl ? "https" : "http";
    return scheme + "://" + form.host.trim() + ":" + Number(form.webPort);
  }

  function projectDownloadUrl(form) {
    return httpOrigin(form) + "/projector/api/v1/project/download_ctp/";
  }

  function proxyTopic(topic) {
    const match = topic.match(/^Jocket\/State\/[^/]+\/(.+)$/);
    if (!match)
      return "";
    let rest = match[1];
    if (rest.endsWith("/#"))
      rest = rest.slice(0, -2);
    const parts = rest.split("/");
    if (parts[0] === "Equipment" && parts.length >= 3)
      return parts.slice(0, 3).join("/");
    if (parts[0] === "Hardware" && parts[1] === "AppServer" && parts.length >= 5)
      return parts.slice(0, 5).join("/");
    return "";
  }

  const root = typeof globalThis !== "undefined" ? globalThis : window;
  root.cloudUrl = cloudUrl;
  root.unpackCtp = unpackCtp;
  root.buildEntityTopics = buildEntityTopics;
  root.serviceTopics = serviceTopics;
  root.formatPayload = formatPayload;
  root.httpOrigin = httpOrigin;
  root.projectDownloadUrl = projectDownloadUrl;
  root.proxyTopic = proxyTopic;
  root.STORAGE_KEY = STORAGE_KEY;
  root.loadForm = loadForm;
  root.uuidBraced = uuidBraced;
  root.clientId = clientId;
})();
