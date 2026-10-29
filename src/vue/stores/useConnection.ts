// @ts-nocheck
import { reactive, ref } from "vue";
import { cloudUrl, unpackCtp } from "../../core/ctp";
import { httpOrigin, projectDownloadUrl, fetchState } from "../../core/http";
import { buildEntityTopics, serviceTopics, proxyTopic } from "../../core/topics";

const STORAGE_KEY = "jocket-web-connection";

function defaults() {
  return {
    source: "server", host: "", port: 1883, webPort: 80,
    user: "", password: "", ssl: false, cloudCode: "", fileName: ""
  };
}

export type ConnectionStore = ReturnType<typeof useConnection>;

function savedForm() {
  try {
    return { ...defaults(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch (_) {
    return defaults();
  }
}

function uuidBraced() {
  return "{" + crypto.randomUUID() + "}";
}

export function useConnection(projectStore, engineryStore) {
  const form = reactive(savedForm());
  const busy = ref(false);
  const error = ref("");
  const status = ref("Ожидание");
  const connected = ref(false);
  const dialogOpen = ref(true);
  const sessionId = ref("");
  const clientId = ref("");
  const brokerUrl = ref("");
  const topics = ref([]);
  let file = null;
  let timer = 0;
  let polling = false;

  function onFile(event) {
    file = event.target.files && event.target.files[0];
    form.fileName = file ? file.name : "";
  }

  async function sourceBytes() {
    if (form.source === "file") {
      if (!file)
        throw new Error("Выберите файл проекта .ctp");
      status.value = "Чтение файла";
      return new Uint8Array(await file.arrayBuffer());
    }
    if (form.source === "cloud") {
      const url = cloudUrl(form.cloudCode.trim());
      brokerUrl.value = url;
      status.value = "Загрузка из Т-Облака";
      const response = await fetch(url);
      if (!response.ok)
        throw new Error("Т-Облако ответило " + response.status);
      return new Uint8Array(await response.arrayBuffer());
    }
    const url = projectDownloadUrl(form);
    brokerUrl.value = url;
    status.value = "Загрузка проекта";
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }
    });
    if (!response.ok)
      throw new Error("Сервер ответил " + response.status + " на загрузку проекта");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b)
      throw new Error("Сервер прислал не архив проекта");
    return bytes;
  }

  function applyState(rows, data) {
    if (!data || typeof data !== "object")
      return;
    const at = new Date().toLocaleTimeString();
    for (const row of rows) {
      if (!Object.prototype.hasOwnProperty.call(data, row.field))
        continue;
      if (row.entityId !== null && row.entityId !== undefined)
        engineryStore.core.updateState(row.entityId, row.field, data[row.field]);
      else if (row.stateTarget)
        row.stateTarget.updateState(row.field, data[row.field]);
      const value = data[row.field];
      row.value = typeof value === "object" ? JSON.stringify(value) : String(value);
      row.at = at;
    }
  }

  async function pollStates() {
    if (polling || !connected.value)
      return;
    polling = true;
    try {
      const groups = new Map();
      for (const row of topics.value) {
        const key = proxyTopic(row.topic);
        if (!key)
          continue;
        if (!groups.has(key))
          groups.set(key, []);
        groups.get(key).push(row);
      }
      const queue = Array.from(groups);
      let index = 0;
      const worker = async () => {
        while (index < queue.length && connected.value) {
          const [key, rows] = queue[index++];
          try {
            const data = await fetchState(form, key);
            applyState(rows, data);
          } catch (_) {}
        }
      };
      await Promise.all([worker(), worker(), worker()]);
    } finally {
      polling = false;
    }
  }

  function stopPoll() {
    connected.value = false;
    clearInterval(timer);
    timer = 0;
  }

  async function connect() {
    busy.value = true;
    error.value = "";
    stopPoll();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      status.value = "Подключение";
      const project = unpackCtp(await sourceBytes());
      engineryStore.core.build(project);
      projectStore.setProject(project);
      sessionId.value = uuidBraced();
      topics.value = buildEntityTopics(project);
      topics.value.unshift(...serviceTopics(project.id, sessionId.value));
      if (form.host.trim()) {
        connected.value = true;
        brokerUrl.value = httpOrigin(form);
        pollStates();
        timer = setInterval(pollStates, 10000);
      } else {
        connected.value = true;
      }
      status.value = "Подключено";
      dialogOpen.value = false;
    } catch (caught) {
      error.value = caught.message || String(caught);
      status.value = "Ошибка";
      stopPoll();
    } finally {
      busy.value = false;
    }
  }

  return {
    form, busy, error, status, connected, dialogOpen, sessionId, clientId,
    brokerUrl, topics, onFile, connect, stopPoll
  };
}
