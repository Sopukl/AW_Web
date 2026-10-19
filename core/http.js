export function httpOrigin(form) {
  return (form.ssl ? "https" : "http") + "://" +
    form.host.trim() + ":" + Number(form.webPort);
}

export function projectDownloadUrl(form) {
  return httpOrigin(form) + "/projector/api/v1/project/download_ctp/";
}

export async function fetchState(form, topic, fetchImpl = fetch) {
  const response = await fetchImpl(
    httpOrigin(form) + "/proxy/v1/state?topic=" + encodeURIComponent(topic)
  );
  if (!response.ok)
    return null;
  return response.json();
}
