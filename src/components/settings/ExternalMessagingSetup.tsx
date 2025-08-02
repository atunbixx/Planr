'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MessageSquare, CheckCircle2, AlertCircle, 
  ExternalLink, Copy, RefreshCw, Settings, TestTube,
  Loader2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ServiceStatus {
  connected: boolean;
  error?: string;
  details?: any;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export function ExternalMessagingSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState<ServiceStatus>({ connected: false });
  const [resendStatus, setResendStatus] = useState<ServiceStatus>({ connected: false });
  const [webhookUrls, setWebhookUrls] = useState({
    twilio: '',
    resend: ''
  });

  // Configuration state
  const [config, setConfig] = useState({
    // Twilio
    TWILIO_ACCOUNT_SID: '',
    TWILIO_AUTH_TOKEN: '',
    TWILIO_PHONE_NUMBER: '',
    TWILIO_WHATSAPP_NUMBER: '',
    
    // Resend
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: '',
    RESEND_WEBHOOK_SECRET: '',
    
    // Features
    SMS_ENABLED: true,
    WHATSAPP_ENABLED: true,
    EMAIL_ENABLED: true
  });

  useEffect(() => {
    // Get webhook URLs based on current domain
    const baseUrl = window.location.origin;
    setWebhookUrls({
      twilio: `${baseUrl}/api/webhooks/twilio`,
      resend: `${baseUrl}/api/webhooks/resend`
    });
    
    // Load existing configuration
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/settings/messaging');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data.config }));
        setTwilioStatus(data.twilioStatus || { connected: false });
        setResendStatus(data.resendStatus || { connected: false });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        toast.success('Configuration saved successfully');
        await checkServiceStatus();
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Error saving configuration');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/messaging/status');
      if (response.ok) {
        const data = await response.json();
        setTwilioStatus(data.twilio);
        setResendStatus(data.resend);
      }
    } catch (error) {
      console.error('Error checking service status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testService = async (service: 'twilio' | 'resend') => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/settings/messaging/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, config })
      });

      const result: TestResult = await response.json();
      
      if (result.success) {
        toast.success(`${service} test successful: ${result.message}`);
      } else {
        toast.error(`${service} test failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Error testing ${service}`);
      console.error(error);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const StatusIndicator = ({ status }: { status: ServiceStatus }) => {
    if (status.connected) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Not connected</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">External Messaging Setup</h1>
        <p className="text-gray-600">
          Configure Twilio and Resend to enable SMS, WhatsApp, and Email messaging with vendors.
        </p>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Twilio Status</CardTitle>
              <StatusIndicator status={twilioStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>SMS: {config.SMS_ENABLED ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span>WhatsApp: {config.WHATSAPP_ENABLED ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Resend Status</CardTitle>
              <StatusIndicator status={resendStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Email: {config.EMAIL_ENABLED ? 'Enabled' : 'Disabled'}</span>
              </div>
              {resendStatus.details?.domain && (
                <div className="text-xs text-gray-500">
                  Domain: {resendStatus.details.domain}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="twilio" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="twilio">Twilio Setup</TabsTrigger>
          <TabsTrigger value="resend">Resend Setup</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="twilio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twilio Configuration</CardTitle>
              <CardDescription>
                Configure your Twilio account for SMS and WhatsApp messaging.
                <a 
                  href="https://console.twilio.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-500 hover:underline ml-2"
                >
                  Open Twilio Console
                  <ExternalLink className="h-3 w-3 inline ml-1" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="twilio-sid">Account SID</Label>
                  <Input
                    id="twilio-sid"
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.TWILIO_ACCOUNT_SID}
                    onChange={(e) => setConfig(prev => ({ ...prev, TWILIO_ACCOUNT_SID: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="twilio-token">Auth Token</Label>
                  <Input
                    id="twilio-token"
                    type="password"
                    placeholder="Your Twilio Auth Token"
                    value={config.TWILIO_AUTH_TOKEN}
                    onChange={(e) => setConfig(prev => ({ ...prev, TWILIO_AUTH_TOKEN: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="twilio-phone">Phone Number (SMS)</Label>
                  <Input
                    id="twilio-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={config.TWILIO_PHONE_NUMBER}
                    onChange={(e) => setConfig(prev => ({ ...prev, TWILIO_PHONE_NUMBER: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="twilio-whatsapp">WhatsApp Number</Label>
                  <Input
                    id="twilio-whatsapp"
                    type="tel"
                    placeholder="whatsapp:+1234567890"
                    value={config.TWILIO_WHATSAPP_NUMBER}
                    onChange={(e) => setConfig(prev => ({ ...prev, TWILIO_WHATSAPP_NUMBER: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-enabled">Enable SMS</Label>
                  <Switch
                    id="sms-enabled"
                    checked={config.SMS_ENABLED}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, SMS_ENABLED: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsapp-enabled">Enable WhatsApp</Label>
                  <Switch
                    id="whatsapp-enabled"
                    checked={config.WHATSAPP_ENABLED}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, WHATSAPP_ENABLED: checked }))}
                  />
                </div>
              </div>

              <Button
                onClick={() => testService('twilio')}
                disabled={isTesting || !config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN}
                className="w-full"
                variant="outline"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Twilio Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resend Configuration</CardTitle>
              <CardDescription>
                Configure your Resend account for email messaging.
                <a 
                  href="https://resend.com/settings/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-500 hover:underline ml-2"
                >
                  Open Resend Dashboard
                  <ExternalLink className="h-3 w-3 inline ml-1" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="resend-key">API Key</Label>
                  <Input
                    id="resend-key"
                    type="password"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.RESEND_API_KEY}
                    onChange={(e) => setConfig(prev => ({ ...prev, RESEND_API_KEY: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resend-email">From Email</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="notifications@yourdomain.com"
                    value={config.RESEND_FROM_EMAIL}
                    onChange={(e) => setConfig(prev => ({ ...prev, RESEND_FROM_EMAIL: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="resend-secret">Webhook Secret</Label>
                  <Input
                    id="resend-secret"
                    type="password"
                    placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.RESEND_WEBHOOK_SECRET}
                    onChange={(e) => setConfig(prev => ({ ...prev, RESEND_WEBHOOK_SECRET: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-enabled">Enable Email</Label>
                  <Switch
                    id="email-enabled"
                    checked={config.EMAIL_ENABLED}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, EMAIL_ENABLED: checked }))}
                  />
                </div>
              </div>

              <Button
                onClick={() => testService('resend')}
                disabled={isTesting || !config.RESEND_API_KEY}
                className="w-full"
                variant="outline"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Resend Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Webhook Configuration</AlertTitle>
            <AlertDescription>
              Configure these webhook URLs in your Twilio and Resend dashboards to receive vendor replies.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Twilio Webhook</CardTitle>
              <CardDescription>
                Add this URL to your Twilio phone number settings for incoming SMS and WhatsApp messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrls.twilio}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(webhookUrls.twilio)}
                  size="icon"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Configure this URL in: Twilio Console → Phone Numbers → Your Number → Messaging → Webhook
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resend Webhook</CardTitle>
              <CardDescription>
                Add this URL to your Resend webhook settings to receive email replies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrls.resend}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(webhookUrls.resend)}
                  size="icon"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Configure this URL in: Resend Dashboard → Webhooks → Add Endpoint
              </p>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Enable events:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside ml-2">
                  <li>email.received</li>
                  <li>email.bounced</li>
                  <li>email.complained</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          onClick={checkServiceStatus}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
        <Button
          onClick={saveConfiguration}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}