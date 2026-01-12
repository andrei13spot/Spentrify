declare module 'react-native-android-sms-listener' {
  export interface SmsEvent {
    originatingAddress: string;
    body: string;
    timestamp: number;
  }

  const SmsListener: {
    addListener: (callback: (message: SmsEvent) => void) => { remove: () => void };
  };

  export default SmsListener;
}