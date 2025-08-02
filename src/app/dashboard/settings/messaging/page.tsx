import { Metadata } from 'next';
import { ExternalMessagingSetup } from '@/components/settings/ExternalMessagingSetup';

export const metadata: Metadata = {
  title: 'External Messaging Settings | Wedding Planner',
  description: 'Configure SMS, WhatsApp, and Email messaging for vendor communication',
};

export default function MessagingSettingsPage() {
  return <ExternalMessagingSetup />;
}