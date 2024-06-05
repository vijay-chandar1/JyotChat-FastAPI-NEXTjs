"use client"
import Header from "@/app/components/header";
import ChatSection from "./components/chat-section";
import { useState, useEffect } from "react";
import { Slider } from "./components/ui/slider";
import { ComboboxDemo } from "./components/ui/combobox";
import axios from "axios";

export default function Home() {
  // State to hold the current value of each slider
  const [topKValue, setTopKValue] = useState(3);
  const [temperatureValue, setTemperatureValue] = useState(0);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';
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

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 pt-5 p-24 background-gradient">
      <div className="mt-0"> {/* Add margin-top to move Header down */}
      <Header />
      </div>



      {/* <label htmlFor="custom-settings">Custom Settings</label> */}

      <div className="slider-wrapper" style={{ width: '20%', cursor: 'pointer' }}>
        {/* TopK label with selected value */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="topK">
          Top K: {topKValue}
        </label>
        <img 
          src="/info.png" title="Top K refers to the number of most probable alternatives that the model will consider while making predictions. A higher value of K means the model considers more alternatives, which might make the model slower but potentially more accurate." 
          style={{width: '12px', height: '12px', marginLeft: '8px'}}
        />
      </div>
        {/* Slider for TopK */}
        <Slider
          defaultValue={[3]}
          min={1}
          max={5}
          step={1}
          onValueChange={(value) => setTopKValue(value[0])} // Update state when slider value changes
        />
      </div>
      <div className="slider-wrapper" style={{ width: '20%', cursor: 'pointer' }}>
        {/* Temperature label with selected value */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="temperature">
          Temperature: {temperatureValue}
        </label>
        <img 
          src="/info.png" 
          title="Temperature is a parameter of the model that controls the randomness of the predictions. A higher temperature value results in more random predictions, while a lower value makes the predictions more deterministic." 
          style={{width: '12px', height: '12px', marginLeft: '8px'}}
        />
      </div>
      
        {/* Slider for Temperature */}
        <Slider
          defaultValue={[0]}
          min={0}
          max={1}
          step={0.1}
          onValueChange={(value) => setTemperatureValue(value[0])} // Update state when slider value changes
        />
      </div>
      
      <ComboboxDemo/>
      <ChatSection />
      
    </main>
  );
}