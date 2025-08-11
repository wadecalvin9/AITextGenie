import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-robot text-4xl"></i>
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
              AI Chat Platform
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
              Experience powerful AI conversations with multiple models. Get intelligent responses, 
              save your chat history, and access cutting-edge AI technology.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3"
                onClick={() => window.location.href = "/api/login"}
              >
                Get Started
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3"
                onClick={() => {
                  const guestSection = document.getElementById('guest-demo');
                  guestSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Try as Guest
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Powerful Features</h2>
            <p className="mt-4 text-lg text-slate-600">Everything you need for intelligent conversations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-brain text-white"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Multiple AI Models</h3>
                <p className="text-slate-600">Access GPT-4, Claude, Mistral, and other cutting-edge AI models in one platform.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-history text-white"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Chat History</h3>
                <p className="text-slate-600">Save and revisit your conversations. Never lose important insights or discussions.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-white"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure & Private</h3>
                <p className="text-slate-600">Your conversations are encrypted and secure. Privacy is our top priority.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Guest Demo Section */}
      <div id="guest-demo" className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Try Before You Sign Up</h2>
          <p className="text-lg text-slate-600 mb-8">
            Experience our AI chat platform as a guest. Your conversations won't be saved, 
            but you can test all the features.
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            onClick={() => {
              // This would open the chat interface in guest mode
              // For now, redirect to main app which will handle guest mode
              window.location.href = "/?guest=true";
            }}
          >
            Start Guest Chat
            <i className="fas fa-comments ml-2"></i>
          </Button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of users already using our AI chat platform.
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign Up Now
          </Button>
        </div>
      </div>
    </div>
  );
}
