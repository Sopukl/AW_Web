import { connectionKey } from "../stores/keys.js";
const { inject } = globalThis.Vue;

export const ConnectionDialog = {
  setup() { return inject(connectionKey); },
  template: `
    <div v-if="dialogOpen" class="dialog-backdrop">
      <form class="panel connection-dialog" role="dialog" aria-modal="true" aria-labelledby="connection-title" @submit.prevent="connect">
        <h2 id="connection-title">Подключение к серверу</h2>
        <p class="dialog-description">Укажите источник проекта и параметры сервера.</p>
        <fieldset>
          <legend>Источник проекта</legend>
          <label class="choice"><input type="radio" value="file" v-model="form.source"> Файл .ctp</label>
          <label class="choice"><input type="radio" value="cloud" v-model="form.source"> Т-Облако</label>
          <label class="choice"><input type="radio" value="server" v-model="form.source"> Сервер</label>
        </fieldset>
        <label v-if="form.source === 'file'">Файл проекта
          <input type="file" accept=".ctp,application/zip,application/octet-stream" @change="onFile">
          <span class="hint" v-if="form.fileName">{{ form.fileName }}</span>
        </label>
        <label v-if="form.source === 'cloud'">Код Т-Облака
          <input v-model="form.cloudCode" inputmode="numeric" maxlength="12" placeholder="12 цифр" autocomplete="off">
        </label>
        <fieldset>
          <legend>Сервер</legend>
          <label>IP<input v-model="form.host" placeholder="192.168.1.10" autocomplete="off" required></label>
          <div class="split">
            <label>Порт MQTT<input v-model.number="form.port" type="number" min="1" max="65535" required></label>
            <label>Web port<input v-model.number="form.webPort" type="number" min="1" max="65535" required></label>
          </div>
          <label>Пользователь<input v-model="form.user" autocomplete="username"></label>
          <label>Пароль<input v-model="form.password" type="password" autocomplete="current-password"></label>
          <label class="choice"><input type="checkbox" v-model="form.ssl"> SSL</label>
          <p class="hint">Web port — это HTTP. Проект скачивается запросом POST /projector/api/v1/project/download_ctp/. Значения топиков читаются запросом GET /proxy/v1/state.</p>
        </fieldset>
        <div class="actions"><button type="submit" :disabled="busy">Подключить</button></div>
        <p class="error" v-if="error">{{ error }}</p>
        <p class="hint" v-if="brokerUrl">{{ brokerUrl }}</p>
        <p class="hint" v-if="clientId">Клиент {{ clientId }}<span v-if="sessionId"> · сессия {{ sessionId }}</span></p>
      </form>
    </div>`
};
