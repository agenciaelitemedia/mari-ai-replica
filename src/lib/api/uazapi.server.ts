export interface UazApiConfig {
  baseUrl: string
  adminToken: string
}

export const uazapi = {
  async createInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/create`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': config.adminToken,
      },
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
      }),
    })
    return res.json()
  },

  async setWebhook(config: UazApiConfig, instanceName: string, webhookUrl: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/webhook/set/${instanceName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': config.adminToken,
      },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhook_by_events: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE",
          "PRESENCE_UPDATE",
          "QRCODE_UPDATED",
          "CALL_UPSERT",
        ],
      }),
    })
    return res.json()
  },

  async setSettings(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/settings/set/${instanceName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': config.adminToken,
      },
      body: JSON.stringify({
        rejectCall: false,
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false,
      }),
    })
    return res.json()
  },

  async deleteInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/delete/${instanceName}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'admintoken': config.adminToken,
      },
    })
    return res.json()
  },

  async fetchInstances(config: UazApiConfig) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/fetchInstances`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'admintoken': config.adminToken,
      },
    })
    return res.json()
  }
}
