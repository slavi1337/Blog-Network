import { useState, useEffect, useRef } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const hasRecognitionSupport = !!SpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!hasRecognitionSupport) {
      setError("Vaš pretraživač ne podržava prepoznavanje govora.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.lang = "sr-RS";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1][0].transcript;
      setTranscript(result);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (isListening || !recognitionRef.current) return;
    try {
      setTranscript("");
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error starting recognition:", err);
      setError("Nije moguće pokrenuti prepoznavanje govora.");
    }
  };

  const stopListening = () => {
    if (!isListening || !recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    hasRecognitionSupport,
  };
};
