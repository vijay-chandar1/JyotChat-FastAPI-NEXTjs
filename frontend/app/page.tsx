"use client"
import Header from "@/app/components/header";
import ChatSection from "./components/chat-section";
import { useState, useEffect } from "react";
import { Slider } from "./components/ui/slider";
// import { ComboboxDemo } from "./components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select"
import axios from "axios";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./components/ui/hovercard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible"
// import { Button } from "./components/ui/button"
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faGear } from '@fortawesome/free-solid-svg-icons'

export default function Home() {
  // State to hold the current value of each slider
  const [selectedModel, setSelectedModel] = useState<'cohere' | 'openai' | null>('cohere');
  const [topKValue, setTopKValue] = useState(3);
  const [temperatureValue, setTemperatureValue] = useState(0);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const handleModelSelection = (value: string) => {
    setSelectedModel(value as 'cohere' | 'openai' | null);
  }

  useEffect(() => {
    // Define a function to make the API call to update temperature
    const updateTemperatureBackend = async () => {
      try {
        await axios.post(`${BASE_URL}/update_temperature`, {
          temperature: temperatureValue
        });
        console.log('Temperature updated in the backend successfully!');
      } catch (error) {
        console.error('Error updating temperature in the backend:', error);
      }
    };

    // Define a function to make the API call to update topK
    const updateTopKBackend = async () => {
      try {
        await axios.post(`${BASE_URL}/update_topk`, {
          topK: topKValue
        });
        console.log('topK updated in the backend successfully!');
      } catch (error) {
        console.error('Error updating topK in the backend:', error);
      }
    };

    // Call the function to update the backend when temperature value changes
    updateTemperatureBackend();
    // Call the function to update the backend when topK value changes
    updateTopKBackend();
  }, [temperatureValue, topKValue]);
  
  useEffect(() => {
    // If no model is selected, return early
    if (!selectedModel) {
      return;
    }

    // Define a function to make the API call to update the model
    const updateModelBackend = async () => {
      try {
        await axios.post(`${BASE_URL}/select_model`, {
          model: selectedModel
        });
        console.log('Model updated in the backend successfully!');
      } catch (error) {
        console.error('Error updating model in the backend:', error);
      }
    };

    updateModelBackend();
  }, [selectedModel]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 pt-5 p-24 background-gradient">
      <div className="mt-0"> 
        {/* Add margin-top to move Header down */}
      <Header />
      </div>

      <Collapsible>
        <CollapsibleTrigger style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        {/* <FontAwesomeIcon icon={faGear} /> &nbsp; */}
        <HoverCard>
        <HoverCardTrigger
        style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          backgroundColor: '#f0f0f0', // Light greyish-white color
          color: '#000000', // Black text
          borderRadius: '0.5rem',
          cursor: 'pointer',
          textAlign: 'center',
          border: 'none',
          transition: 'background-color 0.3s ease',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'} // Slightly darker grey on hover
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'} // Light greyish-white when not hovered
      >
          Custom Settings
        </HoverCardTrigger>
        <HoverCardContent>
          Click to Toggle 
        </HoverCardContent>
      </HoverCard>
        
        {/* <Button variant="outline">Custom Settings</Button> */}

        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* <div className="slider-wrapper" style={{ width: '20%', cursor: 'pointer' }}> */}
        {/* TopK label with selected value */}
        <br></br>
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="topK">
          Top K: {topKValue}
        </label>
        <HoverCard>
          <HoverCardTrigger>
          <img 
          src="/info.png" 
          style={{width: '12px', height: '12px', marginLeft: '8px', cursor: 'pointer'}}
        />
          </HoverCardTrigger>
          <HoverCardContent>
          Uses the most relevant results based on ranking
          </HoverCardContent>
        </HoverCard>
        
      </div>
      <div style={{ cursor: 'pointer' }}>
        {/* Slider for TopK */}
        <Slider
          defaultValue={[3]}
          min={1}
          max={5}
          step={1}
          onValueChange={(value) => setTopKValue(value[0])} // Update state when slider value changes
        />
        </div>
        <br></br>
      {/* </div> */}
      {/* <div className="slider-wrapper" style={{ width: '20%', cursor: 'pointer' }}> */}
        {/* Temperature label with selected value */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="temperature">
          Temperature: {temperatureValue}
        </label>
        <HoverCard>
          <HoverCardTrigger>
          <img 
          src="/info.png" 
          style={{width: '12px', height: '12px', marginLeft: '8px', cursor: 'pointer'}}
        />
          </HoverCardTrigger>
          <HoverCardContent>
          Controls model creativity and response diversity
          </HoverCardContent>
        </HoverCard>
      </div>
      <div style={{ cursor: 'pointer' }}>
        {/* Slider for Temperature */}
        <Slider
          defaultValue={[0]}
          min={0}
          max={1}
          step={0.1}
          onValueChange={(value) => setTemperatureValue(value[0])} // Update state when slider value changes
        />
      </div>
      {/* </div> */}
      <br></br>
      <HoverCard>
          <HoverCardTrigger>
          <Select onValueChange={handleModelSelection} defaultValue="cohere">
            <SelectTrigger className="w-[180px]">
              <SelectValue>{selectedModel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cohere">cohere</SelectItem>
              <SelectItem value="openai">openai</SelectItem>
              {/* <SelectItem value="llama">llama</SelectItem> */}
            </SelectContent>
          </Select>
          </HoverCardTrigger>
        <HoverCardContent>
        Select Model
        </HoverCardContent>
      </HoverCard>


        </CollapsibleContent>
      </Collapsible>

      {/* <label htmlFor="custom-settings">Custom Settings</label> */}

      
      {/* <ComboboxDemo/> */}
      <ChatSection />
      
    </main>
  );
}