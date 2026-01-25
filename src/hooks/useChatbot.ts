import { supabase } from "@/integrations/supabase/client";
import { ENDPOINTS } from "@/config/endpoints";

export interface ChatbotResponse {
  content: string;
  suggestions?: string[];
  escalation?: boolean;
}

/**
 * Ask the chatbot a question via the FastAPI backend
 */
export async function askChatbot(message: string): Promise<ChatbotResponse> {
  try {
    console.log("Sending message to chatbot:", message);

    const response = await fetch(`${ENDPOINTS.itemBackend}/chatbot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Chatbot request failed" }));
      throw new Error(error.error || error.message || "Chatbot request failed");
    }

    const data = await response.json();
    console.log("Chatbot response received:", data);

    if (!data) {
      console.error("No data in response");
      throw new Error("No data in response");
    }

    if (!data.content) {
      console.error("No content in response:", data);
      throw new Error("Invalid response from chatbot - no content");
    }

    return {
      content: data.content,
      suggestions: data.suggestions || [],
      escalation: data.escalation || false,
    };
  } catch (error) {
    console.error("Failed to ask chatbot:", error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      return {
        content:
          "I'm having trouble connecting to the server right now. Please check your internet connection and try again.",
        suggestions: ["Try again", "Contact support"],
      };
    }

    // Return a friendly fallback
    return {
      content:
        "Sorry, I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team at support@ctrlchecks.com.",
      suggestions: ["Try again", "Contact support"],
    };
  }
}
