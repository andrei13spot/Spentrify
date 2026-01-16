import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext'; 

const TransactionListener = () => {
  const router = useRouter();
  const { user } = useAuth(); 

  useEffect(() => {
    let subscription: any = null;

    const initListener = async () => {
      if (!user?.id) {
          console.log("Creating listener paused: No user logged in.");
          return;
      }

      if (Platform.OS === 'android') {
        try {
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
            console.log("SMS Listener Active for User ID:", user.id);
            
            // Start Listening
            subscription = SmsListener.addListener(async (message: any) => {
              console.log("SMS Received:", message.body);

              // Double check kung may user pa rin bago mag-send
              if (!user?.id) return;

              try {
                const response = await axios.post('http://10.0.2.2:3000/api/transactions/detect', {
                  raw_text: message.body,
                  user_id: Number(user.id)
                });

                if (response.data.success) {
                  console.log("Transaction Detected! Opening Pop-up...");
                  
                  router.push({
                    pathname: '/pop-up',
                    params: { 
                      amount: response.data.data.amount,
                      merchant: response.data.data.merchant_name,
                      category_id: response.data.data.category_id,
                      date: response.data.data.transaction_date,
                      user_id: user.id 
                    }
                  });
                }
              } catch (error) {
                // Safe error logging
                console.error("API Error:", error);
              }
            });

          } else {
            console.log("SMS Permission Denied");
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    initListener();

    // Clean up function
    return () => {
      if (subscription) {
        subscription.remove();
        console.log("Listener removed");
      }
    };

  }, [router, user]); // Re-run effect if user changes

  return null;
};

export default TransactionListener;
