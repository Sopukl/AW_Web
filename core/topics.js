function label(item) {
  return item.name || item.label || item.title || ("id " + item.id);
}

function fields(classifier, group, type) {
  const result = (classifier[group] || {})[type];
  return result && result.length ? result : ["#"];
}

function add(list, seen, topic, row) {
  if (seen.has(topic)) {
    const previous = seen.get(topic);
    if (row.entity && !previous.entity.includes(row.entity))
      previous.entity += ", " + row.entity;
    return;
  }
  const value = Object.assign({
    topic, kind: "", entity: "", entityId: null, type: "", field: "", value: "", at: ""
  }, row);
  seen.set(topic, value);
  list.push(value);
}

export function buildEntityTopics(project, classifier = globalThis.JOCKET) {
  const list = [];
  const seen = new Map();
  const pid = project.id;
  const locations = new Map(project.locations.map((item) => [item.id, label(item)]));
  for (const item of project.engineries || []) {
    if (!item.type || item.id === undefined)
      continue;
    for (const field of fields(classifier, "enginery", item.type)) {
      const tail = `Jocket/State/${pid}/Equipment/${item.type}/${item.id}`;
      add(list, seen, field === "#" ? tail + "/#" : tail + "/" + field, {
        kind: "Инженерия", entity: label(item), entityId: item.id, type: item.type, field
      });
    }
  }
  for (const item of project.subgineries || []) {
    if (!item.type)
      continue;
    const id = item.locationID !== undefined && item.locationID !== null && item.locationID >= 0
      ? item.locationID : item.id;
    const entity = label(item) + (locations.get(id) ? " · " + locations.get(id) : "");
    for (const field of fields(classifier, "subginery", item.type)) {
      const tail = `Jocket/State/${pid}/Equipment/${item.type}/${id}`;
      add(list, seen, field === "#" ? tail + "/#" : tail + "/" + field,
        { kind: "Сабджинерия", entity, type: item.type, field });
    }
  }
  const managers = new Map((project.managers || []).map((item) => [item.id, item]));
  for (const item of project.managers || []) {
    if (!item.type || item.serverID === undefined)
      continue;
    for (const field of fields(classifier, "manager", item.type)) {
      const tail = `Jocket/State/${pid}/Hardware/AppServer/${item.serverID}/${item.type}/${item.id}`;
      add(list, seen, field === "#" ? tail + "/#" : tail + "/" + field,
        { kind: "Менеджер", entity: label(item), type: item.type, field });
    }
  }
  for (const item of project.providers || []) {
    const manager = managers.get(item.managerID);
    if (!item.type || !manager || manager.serverID === undefined)
      continue;
    for (const field of fields(classifier, "provider", item.type)) {
      const tail = `Jocket/State/${pid}/Hardware/AppServer/${manager.serverID}/${manager.type}/${manager.id}/${item.type}/${item.id}`;
      add(list, seen, field === "#" ? tail + "/#" : tail + "/" + field,
        { kind: "Провайдер", entity: label(item), type: item.type, field });
    }
  }
  return list;
}

export function serviceTopics(projectId, sessionId) {
  return [
    [`Jocket/State/${projectId}/Equipment/#`, "Состояние инженерии", "Jocket", "#"],
    [`Jocket/State/${projectId}/Hardware/#`, "Состояние аппаратуры", "Jocket", "#"],
    [`Jocket/Reply/${projectId}/${sessionId}/#`, "Ответы сессии", "Jocket", "#"],
    [`Project/${projectId}/Local/Preset/#`, "Пресеты", "Project", "#"],
    [`Project/${projectId}/Hash`, "Хеш проекта", "Project", "Hash"]
  ].map(([topic, entity, type, field]) => ({
    topic, kind: "Подписка", entity, type, field, value: "", at: ""
  }));
}

export function proxyTopic(topic) {
  const match = topic.match(/^Jocket\/State\/[^/]+\/(.+)$/);
  if (!match)
    return "";
  let rest = match[1].replace(/\/#$/, "");
  const parts = rest.split("/");
  if (parts[0] === "Equipment" && parts.length >= 3)
    return parts.slice(0, 3).join("/");
  if (parts[0] === "Hardware" && parts[1] === "AppServer" && parts.length >= 5)
    return parts.slice(0, 5).join("/");
  return "";
}
