import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'

const INPUT_GITHUB_TOKEN = 'github-token'
const INPUT_JIRA_ACCOUNT = 'jira-account'
const INPUT_TICKET_REGEX = 'ticket-regex'
const INPUT_TICKET_REGEX_FLAGS = 'ticket-regex-flags'
const INPUT_EXCEPTION_REGEX = 'exception-regex'
const INPUT_EXCEPTION_REGEX_FLAGS = 'exception-regex-flags'
const INPUT_CLEAN_TITLE_REGEX = 'clean-title-regex'
const INPUT_CLEAN_TITLE_REGEX_FLAGS = 'clean-title-regex-flags'
const INPUT_PREVIEW_LINK = 'preview-link'

const PREVIEW_LINK_TEXT = 'Preview'
const JIRA_LINK_TEXT = 'Jira ticket'

function cleanPullRequestTitle(title: string) {
  /* remove leading colons, hyphens and spaces */
  title = title.replace(/^[ \-:]+/, '')

  /* remove trailing colons, hyphens,stops and spaces */
  title = title.replace(/[ \-:\.]+$/, '')

  /* Uppercase the first letter of the title */
  title = title.charAt(0).toUpperCase() + title.slice(1)

  /* put a dot at the end of the title*/
  title = `${title}.`

  return title
}

function buildJiraLink(ticketNumber: string, jiraAccount: string) {
  const jiraLink = `https://${jiraAccount}.atlassian.net/browse/${ticketNumber}`
  return `**[${JIRA_LINK_TEXT}](${jiraLink})**\n`
}

async function run(): Promise<void> {
  try {
    if (!context.payload.pull_request) return

    const token = core.getInput(INPUT_GITHUB_TOKEN)
    const jiraAccount = core.getInput(INPUT_JIRA_ACCOUNT)
    const ticketRegexInput = core.getInput(INPUT_TICKET_REGEX)
    const ticketRegexFlags = core.getInput(INPUT_TICKET_REGEX_FLAGS)
    const exceptionRegex = core.getInput(INPUT_EXCEPTION_REGEX)
    const exceptionRegexFlags = core.getInput(INPUT_EXCEPTION_REGEX_FLAGS)
    const cleanTitleRegexInput = core.getInput(INPUT_CLEAN_TITLE_REGEX)
    const cleanTitleRegexFlags = core.getInput(INPUT_CLEAN_TITLE_REGEX_FLAGS)
    const previewLink = core.getInput(INPUT_PREVIEW_LINK)

    const requiredInputs = {
      [INPUT_JIRA_ACCOUNT]: jiraAccount,
      [INPUT_TICKET_REGEX]: ticketRegexInput,
    }
    const missingRequiredInputs = Object.entries(requiredInputs).filter(([, input]) => !input)

    if (missingRequiredInputs.length) {
      const plural = missingRequiredInputs.length > 1 ? 's' : ''
      const list = missingRequiredInputs.map(([name]) => name).join(', ')
      core.error(`Missing required input${plural}: ${list}`)
      return
    }
    const github = getOctokit(token)

    const ticketRegex = new RegExp(ticketRegexInput, ticketRegexFlags)

    const cleanTitleRegex = cleanTitleRegexInput
    ? new RegExp(cleanTitleRegexInput, cleanTitleRegexFlags)
    : undefined
    
    const prNumber = context.payload.pull_request.number
    const request: Parameters<typeof github.rest.pulls.update>[0] = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
    }

    const origPrTitle = context.payload.pull_request.title || /* istanbul ignore next */ ''

    let ticketNumberUppercase = ''
    let ticketLine = ''
    const [ticket] = origPrTitle.match(ticketRegex) || []

    if (ticket) {
      ticketNumberUppercase = ticket.toUpperCase()
      const remainingTitle = origPrTitle.replace(ticket, '').trim()
      const cleanRemainingTitle = cleanPullRequestTitle(remainingTitle)

      request.title = `${ticketNumberUppercase}: ${cleanRemainingTitle}`
      ticketLine = buildJiraLink(ticketNumberUppercase, jiraAccount)
    } else {
      /* we need to extract the ticket number from the branch name  if possible */
      const prTitle = cleanPullRequestTitle(context.payload.pull_request.title || /* istanbul ignore next */ '')

      const headBranch = context.payload.pull_request.head.ref
      const [ticketInBranch] = headBranch.match(ticketRegex) || []

      if (ticketInBranch) {
        ticketNumberUppercase = ticketInBranch.toUpperCase()
        ticketLine = buildJiraLink(ticketNumberUppercase, jiraAccount)
        request.title = `${ticketNumberUppercase}: ${prTitle}`
      } else {
        const isException = new RegExp(exceptionRegex, exceptionRegexFlags).test(headBranch)
  
        if (!isException) {
          const regexStr = ticketRegex.toString()
          core.setFailed(`Neither current branch nor title start with a Jira ticket ${regexStr}.`)
        } else {
          const titleHasException = new RegExp(exceptionRegex, exceptionRegexFlags).test(prTitle);
          if (!titleHasException) {
              request.title = `HOTFIX: ${prTitle}`
          }
        }
      }
    }

    const prBody = context.payload.pull_request.body || /* istanbul ignore next */ ''

    const prPreviewLine = previewLink ? `**[${PREVIEW_LINK_TEXT}](${previewLink})**\n` : ''

    if (prPreviewLine || ticketLine) {
      let hasBodyChanged = false
      const updatedBody = prBody.replace(
        new RegExp(
          `^(\\*\\*\\[${PREVIEW_LINK_TEXT}\\][^\\n]+\\n)?` +
            `(\\*\\*\\[${JIRA_LINK_TEXT}\\][^\\n]+\\n)?\\n?`
        ),
        (        match: string) => {
          const replacement = `${prPreviewLine}${ticketLine}\n`
          hasBodyChanged = match !== replacement
          return replacement
        }
      )
      if (hasBodyChanged) request.body = updatedBody
    }
    if (request.title || request.body) {
      const response = await github.rest.pulls.update(request)

      if (response.status !== 200) {
        core.error(`Updating the pull request has failed with ${response.status}`)
      }
    }
  } catch (error) {
    /* istanbul ignore next */
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
    core.setFailed(message)
  }
}

run()
