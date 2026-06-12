// Thin wrapper around Slack Web API. Returns a Result type instead of throwing
// so notification call sites can stay flat: a Slack outage must never fail the
// HTTP request (or cron run) that triggered the notification.

export type SlackResult = { ok: true } | { ok: false; error: string }

const SLACK_API_URL = "https://slack.com/api/chat.postMessage"
const TIMEOUT_MS    = 3000

// Sends a Slack DM by passing the user's Slack ID as the channel — Slack opens
// (or reuses) the bot↔user DM channel automatically. Requires the bot token to
// have the `chat:write` scope and the target user to be in the same workspace.
export async function sendSlackDM(slackUserId: string, text: string): Promise<SlackResult> {
  return postSlackMessage(slackUserId, text)
}

// Sends a message into a Slack channel. The channel ID looks like `C0123456789`
// and can be copied from Slack's channel details panel. The bot must be a
// member of the channel — otherwise Slack returns `not_in_channel`.
export async function sendSlackChannel(channelId: string, text: string): Promise<SlackResult> {
  return postSlackMessage(channelId, text)
}

// Slack's chat.postMessage accepts a user ID or a channel ID under the same
// `channel` parameter, so DM and channel paths share this core.
async function postSlackMessage(target: string, text: string): Promise<SlackResult> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    return { ok: false, error: "missing_token" }
  }

  let response: Response
  try {
    response = await fetch(SLACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json; charset=utf-8",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: target, text, mrkdwn: true, unfurl_links: false, unfurl_media: false }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch_failed" }
  }

  let payload: { ok?: boolean; error?: string; needed?: string; provided?: string }
  try {
    payload = (await response.json()) as typeof payload
  } catch {
    return { ok: false, error: `non_json_response_${response.status}` }
  }

  if (payload.ok) return { ok: true }
  // Surface scope diagnostics when Slack returns missing_scope so the operator
  // can see exactly what scope to add and reinstall.
  const detail =
    payload.error === "missing_scope" && (payload.needed || payload.provided)
      ? `${payload.error} (needed=${payload.needed ?? "?"}, provided=${payload.provided ?? "?"})`
      : payload.error ?? `http_${response.status}`
  return { ok: false, error: detail }
}
