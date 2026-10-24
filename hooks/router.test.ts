import { expect, test } from 'claude-code/testing'
import { classify } from './register'

test('tasks map to tiers', async () => {
  expect(classify('Make contact sheets of the B-roll frames')).toBe('haiku')
  expect(classify('Download the trailer with yt-dlp')).toBe('haiku')
  expect(classify('Build the overlay plan for the LF')).toBe('sonnet')
  expect(classify('Judge the script and lock it')).toBe('judge')
  expect(classify('Scan the frames, then give the final check verdict')).toBe('judge')
  expect(classify('Think about it')).toBe('judge')
})
