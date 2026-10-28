import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('admin@school.test');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      
      Alert.alert("Success", `Welcome ${res.data.user.firstName}!`);
      
    } catch (err) {
      Alert.alert("Login Failed", err.response?.data?.error || 'Check your credentials or IP address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 justify-center bg-gray-100 px-6"
    >
      <View className="bg-white p-8 rounded-2xl shadow-lg">
        <Text className="text-3xl font-bold text-center text-indigo-600 mb-8">School Portal</Text>
        
        <Text className="text-gray-700 font-medium mb-1">Email</Text>
        <TextInput 
          className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="text-gray-700 font-medium mb-1">Password</Text>
        <TextInput 
          className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-6 text-gray-800"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          className="bg-indigo-600 rounded-lg p-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}