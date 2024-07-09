import { Check, Copy } from "lucide-react";
import { Message } from "ai";
import { Fragment, useState, useRef, useEffect } from "react";
import { Button } from "../button";
import ChatAvatar from "./chat-avatar";
import { ChatEvents } from "./chat-events";
import { ChatImage } from "./chat-image";
import { ChatSources } from "./chat-sources";
import {
  AnnotationData,
  EventData,
  ImageData,
  MessageAnnotation,
  MessageAnnotationType,
  SourceData,
} from "./index";
import Markdown from "./markdown";
import { useCopyToClipboard } from "./use-copy-to-clipboard";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh, faStopCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { Switch } from "../switch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../hovercard"

type ContentDisplayConfig = {
  order: number;
  component: JSX.Element | null;
};

function getAnnotationData<T extends AnnotationData>(
  annotations: MessageAnnotation[],
  type: MessageAnnotationType,
): T[] {
  return annotations.filter((a) => a.type === type).map((a) => a.data as T);
}

function ChatMessageContent({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const annotations = message.annotations as MessageAnnotation[] | undefined;
  if (!annotations?.length) return <Markdown content={message.content} />;

  const imageData = getAnnotationData<ImageData>(
    annotations,
    MessageAnnotationType.IMAGE,
  );
  const eventData = getAnnotationData<EventData>(
    annotations,
    MessageAnnotationType.EVENTS,
  );
  const sourceData = getAnnotationData<SourceData>(
    annotations,
    MessageAnnotationType.SOURCES,
  );

  const contents: ContentDisplayConfig[] = [
    {
      order: -2,
      component: imageData[0] ? <ChatImage data={imageData[0]} /> : null,
    },
    {
      order: -1,
      component:
        eventData.length > 0 ? (
          <ChatEvents isLoading={isLoading} data={eventData} />
        ) : null,
    },
    {
      order: 0,
      component: <Markdown content={message.content} />,
    },
    {
      order: 1,
      component: sourceData[0] ? <ChatSources data={sourceData[0]} /> : null,
    },
  ];

  return (
    <div className="flex-1 gap-4 flex flex-col">
      {contents
        .sort((a, b) => a.order - b.order)
        .map((content, index) => (
          <Fragment key={index}>{content.component}</Fragment>
        ))}
    </div>
  );
}

export default function ChatMessage({
  chatMessage,
  isLoading,
}: {
  chatMessage: Message;
  isLoading: boolean;
}) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  const [isToggled, setIsToggled] = useState(false);
  const [originalContent, setOriginalContent] = useState(chatMessage.content);
  const [translatedContent, setTranslatedContent] = useState("");
  const [isLoadingAudio, setIsLoadingAudio] = useState(false); // Add state for loading audio


  useEffect(() => {
    const translateContent = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
      try {
        const response = await axios.post(`${BASE_URL}/translate`, { text: originalContent, target_language: 'en' });
        setTranslatedContent(response.data.translated_text);
      } catch (error) {
        console.error('Error translating content:', error);
      }
    };

    if (isToggled && !translatedContent) {
      translateContent();
    }
  }, [isToggled, originalContent, translatedContent]);

  useEffect(() => {
    // Reset translation state when new message is received
    setOriginalContent(chatMessage.content);
    setTranslatedContent("");
    setIsToggled(false);
  }, [chatMessage.content]);

  const handleAudioControl = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
    try {
      if (isPlaying) {
        // If audio is playing, stop it
        if (audioElement.current) {
          audioElement.current.pause();
        }
      } else {
        setIsLoadingAudio(true); // Set loading state to true
        // If audio is not playing, play it
        const contentToPlay = isToggled ? translatedContent || originalContent : originalContent;
        const response = await axios.post(`${BASE_URL}/play_audio`, { message: contentToPlay }, { responseType: 'arraybuffer' });
        if (response.data) {
          const blob = new Blob([response.data], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          audioElement.current = new Audio(url);
          audioElement.current.play();
  
          audioElement.current.addEventListener('ended', () => {
            setIsPlaying(false);
          });
  
          audioElement.current.addEventListener('canplaythrough', () => {
            setIsLoadingAudio(false); // Set loading state to false when audio is ready
            setIsPlaying(true);
          });
        }
      }
      // Update isPlaying state
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error controlling audio:', error);
      setIsLoadingAudio(false); // Set loading state to false in case of error
    }
  }
  

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  return (
    <div className="flex items-start gap-4 pr-5 pt-5">
      <ChatAvatar role={chatMessage.role} />
      <div className="group flex flex-1 justify-between gap-2">
        <ChatMessageContent
          message={{ ...chatMessage, content: isToggled ? translatedContent || "Translating..." : originalContent }}
          isLoading={isLoading}
        />
        <div className="flex items-center gap-2">
          {chatMessage.role !== 'user' && (
            <>
          <HoverCard>
          <HoverCardTrigger>
          <Button
                onClick={() => copyToClipboard(isToggled ? translatedContent : originalContent)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: 'transparent' }}
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
          </HoverCardTrigger>
          <HoverCardContent>
            Copy Content
          </HoverCardContent>
          </HoverCard>

          <HoverCard>
          <HoverCardTrigger>
          
              <Button
                onClick={handleToggle}
                size="icon"
                variant="ghost"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: 'transparent' }}
              >
                <Switch checked={isToggled} onCheckedChange={handleToggle} />
              </Button>

          </HoverCardTrigger>
          <HoverCardContent>
            Translate
          </HoverCardContent>
          </HoverCard>

          <HoverCard>
          <HoverCardTrigger>
              <Button
                onClick={handleAudioControl}
                size="icon"
                variant="ghost"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: 'transparent' }}
              >
                {isLoadingAudio ? (
                <FontAwesomeIcon icon={faSpinner} spin size="sm" style={{ cursor: 'pointer' }} />
              ) : (
                <FontAwesomeIcon
                  icon={isPlaying ? faStopCircle : faVolumeHigh}
                  size="sm"
                  style={{ cursor: 'pointer' }}
                />
              )}
            </Button>
            </HoverCardTrigger>
          <HoverCardContent>
            Read Aloud
          </HoverCardContent>
          </HoverCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
