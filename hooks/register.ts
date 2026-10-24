import type { Register } from 'claude-code'

// An agent spawned without a model runs on whatever the settings default to. This mod reads what the
// task is and picks the cheapest tier that does it well: Haiku for legwork, Sonnet for assembly, and
// the parent's model for judgement. It only fills a model nobody chose; an explicit one always wins.

const JUDGE = /\b(script|lock|verdict|judg|final check|angle|title|decide|decision|red[- ]team|review the (draft|script)|go\/no-go)/i
const BUILD = /\b(build|implement|assemble|refactor|write code|research pack|overlay plan|b-roll plan|draft (the )?plan|port|migrate)/i
const MECHANICAL = /\b(contact sheet|frames?|screenshot|transcri|asr|download|yt-dlp|ffmpeg|scan|grep|gather|fetch|scrape|collect|count|list|find files|tally|rename|copy)\b/i

const ROUTED_TYPES = new Set(['general-purpose', 'claude'])
const HAIKU_BUDGET = 'Budget: stay under ~90K context, write results to a file, and return 300 words or fewer.'
const SESSION_MODEL = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5' } as const

export type Tier = 'judge' | 'sonnet' | 'haiku'

// Ties go to the higher tier: a cheap model on a judgement task costs more in redo than it saves.
export const classify = (text: string): Tier => {
  if (JUDGE.test(text)) return 'judge'
  if (BUILD.test(text)) return 'sonnet'
  if (MECHANICAL.test(text)) return 'haiku'
  return 'judge'
}

export const register: Register = on => {
  on('agent.spawn', async ($, e, next) => {
    if (e.fork || e.model || e.workflow || e.resume || !ROUTED_TYPES.has(e.subagentType)) return next(e)
    const tier = classify(`${e.description}\n${e.prompt}`)
    $.ui.log(`${e.description}: ${tier === 'judge' ? `kept on ${e.parentModel}` : tier}`)
    if (tier === 'judge') return next(e)
    const prompt = tier === 'haiku' && !/stay under/i.test(e.prompt) ? `${e.prompt}\n\n${HAIKU_BUDGET}` : e.prompt
    return next({ ...e, model: tier, prompt })
  })

  // Sessions the app starts: a fresh one gets a model for its job and starts at medium effort.
  on('tool.call', { tool: 'mcp__ccd_session__start_session' }, async ($, e, next) => {
    const args = e as unknown as Record<string, unknown>
    if (args.proposal_id || args.initiation === 'offer') return next(e)
    let change: Record<string, unknown> = {}
    if (args.effort === undefined) change.effort = 'medium'
    if (args.context !== 'fork' && args.model === undefined) {
      const tier = classify(`${args.title ?? ''}\n${args.prompt ?? ''}`)
      if (tier !== 'judge') change.model = SESSION_MODEL[tier]
    }
    if (!Object.keys(change).length) return next(e)
    $.ui.log(`session "${String(args.title ?? '')}": ${JSON.stringify(change)}`)
    return next({ ...e, ...change } as typeof e)
  })
}
