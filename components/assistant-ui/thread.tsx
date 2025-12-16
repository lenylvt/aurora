import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MCPSelector } from "@/components/chat/mcp-selector";
import {
  ActionBarPrimitive,
  AssistantIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import * as React from "react";
import type { FC } from "react";

interface ThreadProps {
  userName?: string;
}

export const Thread: FC<ThreadProps> = ({ userName }) => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background relative"
      style={{
        ["--thread-max-width" as string]: "36rem",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="bottom"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-y-scroll scroll-smooth px-4 pt-4 pb-32"
      >
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ThreadWelcome userName={userName} />
        </AssistantIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      {/* Input flottant en bas - avec blur et safe area */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="relative w-full max-w-[var(--thread-max-width)] px-4 pt-6 pb-[max(1rem,var(--sab))]">
          {/* Blur gradient effect - only behind input */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer relative flex w-full flex-col items-center gap-4">
            <ThreadScrollToBottom />
            <Composer />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom -top-12 absolute z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const WELCOME_MESSAGES_TIME_BASED = [
  {
    greeting: "Bonjour {name} ! ☀️",
    subtext: "Prêt pour une nouvelle session ?",
    timeRange: [6, 12] as const, // 6h-12h
  },
  {
    greeting: "Bonne après-midi ! ☕",
    subtext: "Besoin d'aide avec tes devoirs ?",
    timeRange: [12, 18] as const, // 12h-18h
  },
  {
    greeting: "Bonsoir {name} ! 🌙",
    subtext: "Comment puis-je t'aider ce soir ?",
    timeRange: [18, 23] as const, // 18h-23h
  },
] as const;

const WELCOME_MESSAGES_ANYTIME = [
  {
    greeting: "Salut ! 👋",
    subtext: "Je suis là pour t'aider dans tes cours",
  },
  {
    greeting: "Le retour de {name} ! 🎉",
    subtext: "Content de te revoir par ici",
  },
  {
    greeting: "Coucou ! 🌟",
    subtext: "Qu'est-ce qu'on étudie aujourd'hui ?",
  },
  {
    greeting: "Hey {name} ! 🚀",
    subtext: "C'est parti pour apprendre",
  },
] as const;

interface ThreadWelcomeProps {
  userName?: string;
}

const ThreadWelcome: FC<ThreadWelcomeProps> = ({ userName }) => {
  // Choisir un message de bienvenue en fonction de l'heure
  const [welcomeMessage] = React.useState(() => {
    const currentHour = new Date().getHours();

    // Filtrer les messages basés sur l'heure
    const timeBasedMessages = WELCOME_MESSAGES_TIME_BASED.filter((msg) => {
      const [start, end] = msg.timeRange;
      return currentHour >= start && currentHour < end;
    });

    // Combiner messages de l'heure + messages génériques
    const availableMessages = [
      ...timeBasedMessages.map(({ greeting, subtext }) => ({ greeting, subtext })),
      ...WELCOME_MESSAGES_ANYTIME,
    ];

    // Choisir aléatoirement
    const randomIndex = Math.floor(Math.random() * availableMessages.length);
    return availableMessages[randomIndex];
  });

  const greeting = welcomeMessage.greeting.replace("{name}", userName || "toi");

  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] grow flex-col px-4">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col justify-center">
          <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in font-bold text-4xl duration-200">
            {greeting}
          </h1>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in text-muted-foreground delay-75 duration-200">
            {welcomeMessage.subtext}
          </p>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const SUGGESTIONS = [
  {
    title: "Quiz-moi sur",
    label: "mes révisions",
    prompt: "Pose-moi des questions pour tester mes connaissances sur",
  },
  {
    title: "Aide-moi avec",
    label: "mon devoir",
    prompt: "Aide-moi à comprendre et résoudre mon exercice",
  },
] as const;

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions grid w-full @md:grid-cols-2 gap-2 pb-4">
      {SUGGESTIONS.map((suggestion, index) => (
        <div
          key={suggestion.prompt}
          className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 @md:nth-[n+3]:block nth-[n+3]:hidden animate-in fill-mode-both duration-200"
          style={{ animationDelay: `${100 + index * 50}ms` }}
        >
          <ThreadPrimitive.Suggestion prompt={suggestion.prompt} send asChild>
            <Button
              variant="ghost"
              className="aui-thread-welcome-suggestion h-auto w-full @md:flex-col flex-wrap items-start justify-start gap-1 rounded-2xl border px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
              aria-label={suggestion.prompt}
            >
              <span className="aui-thread-welcome-suggestion-text-1 font-medium">
                {suggestion.title}
              </span>
              <span className="aui-thread-welcome-suggestion-text-2 text-muted-foreground">
                {suggestion.label}
              </span>
            </Button>
          </ThreadPrimitive.Suggestion>
        </div>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone className="aui-composer-attachment-dropzone flex w-full flex-col rounded-2xl border border-input bg-background px-1 pt-2 outline-none transition-shadow data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50">
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder="Message..."
          className="aui-composer-input mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-base sm:text-sm outline-none focus:outline-none focus:ring-0 border-none placeholder:text-muted-foreground"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper relative mx-2 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <ComposerAddAttachment />
        <MCPSelector />
      </div>

      <AssistantIf condition={({ thread }) => !thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="bottom"
            type="submit"
            variant="default"
            size="icon"
            className="aui-composer-send size-8 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AssistantIf>

      <AssistantIf condition={({ thread }) => thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AssistantIf>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-3 duration-150"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content wrap-break-word px-4 text-foreground leading-relaxed">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            tools: { Fallback: ToolFallback },
          }}
        />
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-1 ml-4 flex">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root -ml-1 col-start-3 row-start-2 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AssistantIf condition={({ message }) => message.isCopied}>
            <CheckIcon />
          </AssistantIf>
          <AssistantIf condition={({ message }) => !message.isCopied}>
            <CopyIcon />
          </AssistantIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.ExportMarkdown asChild>
        <TooltipIconButton tooltip="Export as Markdown">
          <DownloadIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.ExportMarkdown>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-4 py-3 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper -translate-x-full -translate-y-1/2 absolute top-1/2 left-0 pr-2">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker -mr-1 col-span-full col-start-1 row-start-3 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col px-4 py-3">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm">Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root -ml-4 mr-4 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
