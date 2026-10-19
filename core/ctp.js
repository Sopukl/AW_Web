import { Project } from "./Project.js";

function textOf(files, name) {
  const key = Object.keys(files).find((item) => item === name || item.endsWith("/" + name));
  return key ? new TextDecoder("utf-8").decode(files[key]) : null;
}

function readList(files, fileName, key) {
  const raw = textOf(files, fileName);
  if (!raw)
    return [];
  const list = JSON.parse(raw)[key];
  if (!Array.isArray(list))
    throw new Error(fileName + " не содержит массив " + key);
  return list;
}

export function cloudUrl(code) {
  if (!/^\d{12}$/.test(code))
    throw new Error("Код Т-Облака — 12 цифр");
  let sum = 0;
  for (const character of code)
    sum += Number(character);
  const base = [
    "https://throne.systems/storage/",
    "https://beta.throne.systems/storage/",
    "https://alpha.throne.systems/storage/"
  ][sum % 10];
  if (!base)
    throw new Error("Код Т-Облака не подходит ни к одному хранилищу");
  return base + code + ".ctp";
}

export function unpackCtp(bytes, unzip = globalThis.fflate && globalThis.fflate.unzipSync) {
  if (!unzip)
    throw new Error("Не загружена библиотека распаковки");
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (data.length < 4 || data[0] !== 0x50 || data[1] !== 0x4b)
    throw new Error("Файл проекта не является zip-архивом .ctp");
  let files;
  try {
    files = unzip(data);
  } catch (error) {
    throw new Error("Не удалось распаковать проект: " + (error.message || error));
  }
  const headerRaw = textOf(files, "header.json");
  if (!headerRaw)
    throw new Error("В архиве нет header.json");
  const header = JSON.parse(headerRaw);
  const source = (header.header && header.header.project) || header.project || {};
  if (source.id === undefined || source.id === null)
    throw new Error("В header.json нет project.id");
  return new Project({
    files: Object.keys(files).sort(),
    id: source.id,
    name: source.title || source.name || ("Проект " + source.id),
    cloudCode: source.cloudCode || "",
    rootLocationID: source.rootLocationID,
    models: readList(files, "models.json", "models"),
    engineries: readList(files, "engineries.json", "engineries"),
    subgineries: readList(files, "subgineries.json", "subgineries"),
    servers: readList(files, "servers.json", "servers"),
    managers: readList(files, "managers.json", "managers"),
    providers: readList(files, "providers.json", "providers"),
    locations: readList(files, "locations.json", "locations")
  });
}
