"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("@actions/core");
var github_1 = require("@actions/github");
var INPUT_GITHUB_TOKEN = 'github-token';
var INPUT_JIRA_ACCOUNT = 'jira-account';
var INPUT_TICKET_REGEX = 'ticket-regex';
var INPUT_TICKET_REGEX_FLAGS = 'ticket-regex-flags';
var INPUT_EXCEPTION_REGEX = 'exception-regex';
var INPUT_EXCEPTION_REGEX_FLAGS = 'exception-regex-flags';
var INPUT_CLEAN_TITLE_REGEX = 'clean-title-regex';
var INPUT_CLEAN_TITLE_REGEX_FLAGS = 'clean-title-regex-flags';
var INPUT_PREVIEW_LINK = 'preview-link';
var PREVIEW_LINK_TEXT = 'Preview';
var JIRA_LINK_TEXT = 'Jira ticket';
function cleanPullRequestTitle(title, cleanTitleRegex) {
    title = title.replace(/\.$/, '');
    title = title.replace(/^-/, '');
    title = cleanTitleRegex ? title.replace(cleanTitleRegex, '') : title;
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var token, jiraAccount, ticketRegexInput, ticketRegexFlags, exceptionRegex, exceptionRegexFlags, cleanTitleRegexInput, cleanTitleRegexFlags, previewLink, requiredInputs, missingRequiredInputs, plural, list, github, ticketRegex, cleanTitleRegex, prNumber, prTitle, prBody, request, prPreviewLine_1, ticketLine_1, headBranch, ticketInBranch, ticketInBranchUpper, jiraLink, isException, regexStr, titleHasException, hasBodyChanged_1, updatedBody, response, error_1, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    if (!github_1.context.payload.pull_request)
                        return [2 /*return*/];
                    token = core.getInput(INPUT_GITHUB_TOKEN);
                    jiraAccount = core.getInput(INPUT_JIRA_ACCOUNT);
                    ticketRegexInput = core.getInput(INPUT_TICKET_REGEX);
                    ticketRegexFlags = core.getInput(INPUT_TICKET_REGEX_FLAGS);
                    exceptionRegex = core.getInput(INPUT_EXCEPTION_REGEX);
                    exceptionRegexFlags = core.getInput(INPUT_EXCEPTION_REGEX_FLAGS);
                    cleanTitleRegexInput = core.getInput(INPUT_CLEAN_TITLE_REGEX);
                    cleanTitleRegexFlags = core.getInput(INPUT_CLEAN_TITLE_REGEX_FLAGS);
                    previewLink = core.getInput(INPUT_PREVIEW_LINK);
                    requiredInputs = (_a = {},
                        _a[INPUT_JIRA_ACCOUNT] = jiraAccount,
                        _a[INPUT_TICKET_REGEX] = ticketRegexInput,
                        _a);
                    missingRequiredInputs = Object.entries(requiredInputs).filter(function (_a) {
                        var input = _a[1];
                        return !input;
                    });
                    if (missingRequiredInputs.length) {
                        plural = missingRequiredInputs.length > 1 ? 's' : '';
                        list = missingRequiredInputs.map(function (_a) {
                            var name = _a[0];
                            return name;
                        }).join(', ');
                        core.error("Missing required input".concat(plural, ": ").concat(list));
                        return [2 /*return*/];
                    }
                    github = (0, github_1.getOctokit)(token);
                    ticketRegex = new RegExp(ticketRegexInput, ticketRegexFlags);
                    cleanTitleRegex = cleanTitleRegexInput
                        ? new RegExp(cleanTitleRegexInput, cleanTitleRegexFlags)
                        : undefined;
                    prNumber = github_1.context.payload.pull_request.number;
                    prTitle = cleanPullRequestTitle(github_1.context.payload.pull_request.title || /* istanbul ignore next */ '', cleanTitleRegex);
                    prBody = github_1.context.payload.pull_request.body || /* istanbul ignore next */ '';
                    request = {
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        pull_number: prNumber,
                    };
                    prPreviewLine_1 = previewLink ? "**[".concat(PREVIEW_LINK_TEXT, "](").concat(previewLink, ")**\n") : '';
                    ticketLine_1 = '';
                    headBranch = github_1.context.payload.pull_request.head.ref;
                    ticketInBranch = (headBranch.match(ticketRegex) || github_1.context.payload.pull_request.title.match(ticketRegex) || [])[0];
                    if (ticketInBranch) {
                        ticketInBranchUpper = ticketInBranch.toUpperCase();
                        jiraLink = "https://".concat(jiraAccount, ".atlassian.net/browse/").concat(ticketInBranchUpper);
                        ticketLine_1 = "**[".concat(JIRA_LINK_TEXT, "](").concat(jiraLink, ")**\n");
                        if (!ticketRegex.test(prTitle))
                            request.title = "".concat(ticketInBranchUpper, ": ").concat(prTitle, ".");
                    }
                    else {
                        isException = new RegExp(exceptionRegex, exceptionRegexFlags).test(headBranch);
                        if (!isException) {
                            regexStr = ticketRegex.toString();
                            core.setFailed("Neither current branch nor title start with a Jira ticket ".concat(regexStr, "."));
                        }
                        else {
                            titleHasException = new RegExp(exceptionRegex, exceptionRegexFlags).test(prTitle);
                            if (!titleHasException) {
                                request.title = "HOTFIX: ".concat(prTitle);
                            }
                        }
                    }
                    if (prPreviewLine_1 || ticketLine_1) {
                        hasBodyChanged_1 = false;
                        updatedBody = prBody.replace(new RegExp("^(\\*\\*\\[".concat(PREVIEW_LINK_TEXT, "\\][^\\n]+\\n)?") +
                            "(\\*\\*\\[".concat(JIRA_LINK_TEXT, "\\][^\\n]+\\n)?\\n?")), function (match) {
                            var replacement = "".concat(prPreviewLine_1).concat(ticketLine_1, "\n");
                            hasBodyChanged_1 = match !== replacement;
                            return replacement;
                        });
                        if (hasBodyChanged_1)
                            request.body = updatedBody;
                    }
                    if (!(request.title || request.body)) return [3 /*break*/, 2];
                    return [4 /*yield*/, github.rest.pulls.update(request)];
                case 1:
                    response = _b.sent();
                    if (response.status !== 200) {
                        core.error("Updating the pull request has failed with ".concat(response.status));
                    }
                    _b.label = 2;
                case 2: return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    message = error_1 instanceof Error ? error_1.message : typeof error_1 === 'string' ? error_1 : '';
                    core.setFailed(message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
run();
