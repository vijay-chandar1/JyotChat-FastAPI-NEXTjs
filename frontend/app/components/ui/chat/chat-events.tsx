import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "../button";
// import { Switch } from "../switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import { EventData } from "./index";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh, faStopCircle } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';
export function ChatEvents({
  data,
  isLoading,
  // isToggled, // Receive isToggled as prop
  // handleToggle, // Receive handleToggle as prop
}: {
  data: EventData[];
  isLoading: boolean;
  // isToggled: boolean;
  // handleToggle: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  const buttonLabel = isOpen ? "Hide events" : "Show events";

  const EventIcon = isOpen ? (
    <ChevronDown className="h-4 w-4" />
  ) : (
    <ChevronRight className="h-4 w-4" />
  );

  const handleAudioControl = async () => {
    const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';
    try {
      if (isPlaying) {
        // If audio is playing, stop it
        if (audioElement.current) {
          audioElement.current.pause();
        }
      } else {
        // If audio is not playing, play it
        const response = await axios.post(`${BASE_URL}/play_audio`, {}, { responseType: 'arraybuffer' });
        if (response.data) {
          const blob = new Blob([response.data], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          console.log(url);
          audioElement.current = new Audio(url);
          console.log(audioElement.current);
          audioElement.current.play();

          audioElement.current.addEventListener('ended', () => {
            setIsPlaying(false);
          });
        }
      }
      // Update isPlaying state
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error controlling audio:', error);
    }
  }

  return (
    <div className="border-l-2 border-indigo-400 pl-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="secondary" className="space-x-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>{buttonLabel}</span>
            {EventIcon}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <div className="mt-4 text-sm space-y-2">
            {data.map((eventItem, index) => (
              <div key={index}>{eventItem.title}</div>
            ))}
          </div>
        </CollapsibleContent>
        {/* <br>
        </br>
        <Switch/> */}
      {/* <Switch checked={isToggled} onCheckedChange={handleToggle} /> */}
      </Collapsible>
      <FontAwesomeIcon 
      icon={isPlaying ? faStopCircle : faVolumeHigh} 
      size="sm" 
      onClick={handleAudioControl}
      style={{ cursor: 'pointer' }}/>      
    </div>
  );
}