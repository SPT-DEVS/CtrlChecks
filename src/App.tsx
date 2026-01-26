import Chatbot from "@/components/ui/Chatbot";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Workflows from "./pages/Workflows";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import WorkflowCreationChoice from "./pages/WorkflowCreationChoice";
import AIWorkflowBuilder from "./pages/AIWorkflowBuilder";
import Executions from "./pages/Executions";
import ExecutionDetail from "./pages/ExecutionDetail";
import Templates from "./pages/Templates";
import TemplatesManager from "./pages/admin/TemplatesManager";
import TemplateEditor from "./pages/admin/TemplateEditor";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminRoute } from "./components/admin/AdminRoute";
import NotFound from "./pages/NotFound";
import GoogleAuthCallback from "./pages/auth/google/Callback";
import FormTrigger from "./pages/FormTrigger";
import MultimodalBuilder from "./pages/MultimodalBuilder";
import ModelTestingDashboard from "./pages/ModelTestingDashboard";
import ModelTestPage from "./pages/ModelTestPage";
import SchedulerInitializer from "./components/workflow/SchedulerInitializer";
import { ConnectionStatus } from "./components/ConnectionStatus";

// Component to conditionally render Chatbot only on landing page
const ConditionalChatbot = () => {
  const location = useLocation();

  // Only show chatbot on the landing page (pre-login pages)
  const showChatbot = location.pathname === "/";

  return showChatbot ? <Chatbot /> : null;
};

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <SchedulerInitializer />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/workflow/create" element={<WorkflowCreationChoice />} />
                <Route path="/workflow/ai" element={<AIWorkflowBuilder />} />
                <Route path="/workflow/:id" element={<WorkflowBuilder />} />
                <Route path="/executions" element={<Executions />} />
                <Route path="/execution/:id" element={<ExecutionDetail />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/templates" element={<AdminRoute><TemplatesManager /></AdminRoute>} />
                <Route path="/admin/template/:id/edit" element={<AdminRoute><TemplateEditor /></AdminRoute>} />
                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                <Route path="/form/:workflowId/:nodeId" element={<FormTrigger />} />
                <Route path="/multimodal" element={<MultimodalBuilder />} />
                <Route path="/multimodal-builder" element={<MultimodalBuilder />} />
                <Route path="/model-testing" element={<ModelTestingDashboard />} />
                <Route path="/model-testing/:category/:model" element={<ModelTestPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ConditionalChatbot />
              <ConnectionStatus />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;