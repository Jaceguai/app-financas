import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerRootComponent } from 'expo';
import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";

import { HamburgerMenu } from './src/components/navigation/HamburgerMenu';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WorkspaceProvider, useWorkspace } from './src/contexts/WorkspaceContext';
import DashboardScreen from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { InsightsScreen } from './src/screens/insights/InsightsScreen';
import { ProjectDetailScreen } from './src/screens/projects/ProjectDetailScreen';
import { ProjectsScreen } from './src/screens/projects/ProjectsScreen';
import { ReportsScreen } from './src/screens/reports/ReportsScreen';
import { AppearanceScreen } from './src/screens/settings/AppearanceScreen';
import { FixedExpensesScreen } from './src/screens/settings/FixedExpensesScreen';
import { IncomesScreen } from './src/screens/settings/IncomesScreen';
import { PreferencesScreen } from './src/screens/settings/PreferencesScreen';
import { SavingsGoalsScreen } from './src/screens/settings/SavingsGoalsScreen';
import { MembersScreen } from './src/screens/workspace/MembersScreen';
import { WorkspaceScreen } from './src/screens/workspace/WorkspaceScreen';
import { ThemeProvider, useTheme } from './src/theme';


const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const queryClient = new QueryClient();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {({ navigation, route }) => (
          <LoginScreen
            onNavigateRegister={() => navigation.navigate('Register')}
            prefilledEmail={(route.params as any)?.email}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen onNavigateLogin={(email?: string) => {
            if (email) {
              navigation.navigate('Login', { email });
            } else {
              navigation.goBack();
            }
          }} />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { isDark } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
          headerTintColor: isDark ? '#ffffff' : '#111827',
          headerShadowVisible: true,
          tabBarActiveTintColor: '#2196f3',
          tabBarInactiveTintColor: isDark ? '#94a3b8' : '#9ca3af',
          tabBarStyle: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderTopColor: isDark ? '#334155' : '#e5e7eb',
          },
          headerRight: () => (
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 16 }}>
              <Ionicons name="menu" size={28} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          ),
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Histórico"
          component={HistoryScreen}
          options={{
            title: 'Histórico',
            tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
      <HamburgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
}

function MainNavigator() {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleNavigate = (screen: string) => {
    setMenuVisible(false);
  };

  return (
    <>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="MainTabs">
          {() => <MainTabs />}
        </MainStack.Screen>
        <MainStack.Screen name="Incomes">
          {({ navigation }) => <IncomesScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="FixedExpenses">
          {({ navigation }) => <FixedExpensesScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="SavingsGoals">
          {({ navigation }) => <SavingsGoalsScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="Members">
          {({ navigation }) => <MembersScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="Preferences">
          {({ navigation }) => <PreferencesScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="Appearance">
          {({ navigation }) => <AppearanceScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="Projects">
          {({ navigation }) => <ProjectsScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="ProjectDetail">
          {({ navigation, route }) => <ProjectDetailScreen route={route} onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="Reports">
          {({ navigation }) => <ReportsScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
        <MainStack.Screen name="Insights">
          {({ navigation }) => <InsightsScreen onGoBack={() => navigation.goBack()} />}
        </MainStack.Screen>
      </MainStack.Navigator>
    </>
  );
}

function LoadingScreen() {
  const { isDark } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f9fafb' }}>
      <ActivityIndicator size="large" color="#2196f3" />
    </View>
  );
}

function NavigationContent() {
  const { isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();
  const [showSplash, setShowSplash] = useState(true);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: '#2196f3',
      background: isDark ? '#0f172a' : '#f9fafb',
      card: isDark ? '#1e293b' : '#ffffff',
      text: isDark ? '#ffffff' : '#111827',
      border: isDark ? '#334155' : '#e5e7eb',
      notification: '#f59e0b',
    },
  };

  // Mostra splash screen primeiro
  if (showSplash) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0f172a' : '#f9fafb'} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  if (authLoading || (user && wsLoading)) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0f172a' : '#f9fafb'} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0f172a' : '#f9fafb'} />
      <NavigationContainer theme={navigationTheme}>
        {!user ? (
          <AuthNavigator />
        ) : !workspace ? (
          <WorkspaceScreen />
        ) : (
          <MainNavigator />
        )}
      </NavigationContainer>
    </>
  );
}

function AppContent() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContent />
        </QueryClientProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
