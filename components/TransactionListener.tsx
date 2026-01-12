import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import axios from 'axios';
import { useRouter } from 'expo-router';

const TransactionListener = () => {
  const router = useRouter();

  useEffect(() => {
    let subscription: any = null;

    const initListener = async () => {
      if (Platform.OS === 'android') {
        try {
          // UPDATE: Changed to RECEIVE_SMS (Ito ang kailangan para sa live listener)
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
            {
              title: "SMS Permission",
              message: "Spentrify needs access to receive SMS to detect transactions.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("✅ SMS Permission Granted - Listening started...");
            
            // Start Listening
            subscription = SmsListener.addListener(async (message: any) => {
              console.log('📩 SMS Received:', message.body);

              try {
                // Send to Backend
                const response = await axios.post('http://10.0.2.2:3000/api/transactions/detect', {
                  raw_text: message.body,
                  user_id: 'default_user' 
                });

                if (response.data.success) {
                  console.log('🚀 Transaction Detected! Opening Pop-up...');
                  
                  // Navigate to Pop-up
                  router.push({
                    pathname: '/pop-up',
                    params: { 
                      amount: response.data.data.amount,
                      merchant: response.data.data.merchant_name,
                      category_id: response.data.data.category_id,
                      date: response.data.data.transaction_date
                    }
                  });
                }
              } catch (error) {
                console.error('❌ API Error:', error);
              }
            });

          } else {
            console.log("❌ SMS Permission Denied");
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    initListener();

    // CLEANUP: Ito ang tamang paraan para patayin ang listener pag-unmount
    return () => {
      if (subscription) {
        subscription.remove();
        console.log("Listener removed");
      }
    };

  }, [router]);

  return null;
};

export default TransactionListener;