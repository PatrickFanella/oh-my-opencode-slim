# React Native Design

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `react-native-design-skill.md`

_Source topic: react-native-design_

**Purpose:** Master React Native styling, navigation, and Reanimated animations for cross-platform mobile development. Use when building React Native apps, implementing navigation patterns, or creating performant animations.

# React Native Design

Master React Native styling patterns, React Navigation, and Reanimated 3 to build performant, cross-platform mobile applications with native-quality user experiences.

## When to Use This Skill

- Building cross-platform mobile apps with React Native
- Implementing navigation with React Navigation 6+
- Creating performant animations with Reanimated 3
- Styling components with StyleSheet and styled-components
- Building responsive layouts for different screen sizes
- Implementing platform-specific designs (iOS/Android)
- Creating gesture-driven interactions with Gesture Handler
- Optimizing React Native performance

## Core Concepts

### 1. StyleSheet and Styling

```typescript
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
...
```

...


### From `mobile-android-design-skill.md`

_Source topic: mobile-android-design_

**Purpose:** Master Material Design 3 and Jetpack Compose patterns for building native Android apps. Use when designing Android interfaces, implementing Compose UI, or following Google's Material Design guidelines.

# Android Mobile Design

Master Material Design 3 (Material You) and Jetpack Compose to build modern, adaptive Android applications that integrate seamlessly with the Android ecosystem.

## When to Use This Skill

- Designing Android app interfaces following Material Design 3
- Building Jetpack Compose UI and layouts
- Implementing Android navigation patterns (Navigation Compose)
- Creating adaptive layouts for phones, tablets, and foldables
- Using Material 3 theming with dynamic colors
- Building accessible Android interfaces
- Implementing Android-specific gestures and interactions
- Designing for different screen configurations

## Core Concepts

### 1. Material Design 3 Principles

- Cards, Buttons, FABs, Chips
- Navigation (rail, drawer, bottom nav)
- Text fields, Dialogs, Sheets
- Lists, Menus, Progress indicators

### 2. Jetpack Compose Layout System

```kotlin
// Vertical arrangement with alignment
Column(
    modifier = Modifier.padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    horizontalAlignment = Alignment.Start
) {
    Text(
        text = "Title",
        style = MaterialTheme.typography.headlineSmall
    )
    Text(
        text = "Subtitle",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

// Horizontal arrangement with weight
...
```

...


### From `mobile-ios-design-skill.md`

_Source topic: mobile-ios-design_

**Purpose:** Master iOS Human Interface Guidelines and SwiftUI patterns for building native iOS apps. Use when designing iOS interfaces, implementing SwiftUI views, or ensuring apps follow Apple's design principles.

# iOS Mobile Design

Master iOS Human Interface Guidelines (HIG) and SwiftUI patterns to build polished, native iOS applications that feel at home on Apple platforms.

## When to Use This Skill

- Designing iOS app interfaces following Apple HIG
- Building SwiftUI views and layouts
- Implementing iOS navigation patterns (NavigationStack, TabView, sheets)
- Creating adaptive layouts for iPhone and iPad
- Using SF Symbols and system typography
- Building accessible iOS interfaces
- Implementing iOS-specific gestures and interactions
- Designing for Dynamic Type and Dark Mode

## Core Concepts

### 1. Human Interface Guidelines Principles

- **iOS**: Touch-first, compact displays, portrait orientation
- **iPadOS**: Larger canvas, multitasking, pointer support
- **visionOS**: Spatial computing, eye/hand input

### 2. SwiftUI Layout System

```swift
// Vertical stack with alignment
VStack(alignment: .leading, spacing: 12) {
    Text("Title")
        .font(.headline)
    Text("Subtitle")
        .font(.subheadline)
        .foregroundStyle(.secondary)
}

// Horizontal stack with flexible spacing
HStack {
    Image(systemName: "star.fill")
    Text("Featured")
    Spacer()
    Text("View All")
        .foregroundStyle(.blue)
}
```

...


### From `navigation-patterns.md`

_Source topic: navigation-patterns_

# React Navigation Patterns
## Setup and Configuration
### Installation
```bash
# Core packages
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
# Required peer dependencies
npm install react-native-screens react-native-safe-area-context
```
### Type-Safe Navigation Setup
```typescript
// navigation/types.ts
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
// Define param lists for each navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: { title: string };
  Auth: NavigatorScreenParams<AuthStackParamList>;
};
export type MainTabParamList = {
  Home: undefined;
  Search: { query?: string };
  Profile: { userId: string };
};
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string };
};
// Screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;
// Global type declaration
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```
### Navigation Hooks
```typescript
// hooks/useAppNavigation.ts
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

### From `reanimated-patterns.md`

_Source topic: reanimated-patterns_

# React Native Reanimated 3 Patterns
## Core Concepts
### Shared Values and Animated Styles
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
function BasicAnimations() {
  // Shared value - can be modified from JS or UI thread
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  // Animated style - runs on UI thread
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  const animate = () => {
    // Spring animation
    scale.value = withSpring(1.2, {
      damping: 10,
      stiffness: 100,
    });
    // Timing animation with easing
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    // Sequence of animations
    rotation.value = withSequence(
      withTiming(15, { duration: 100 }),
      withTiming(-15, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };
  return (
    <Animated.View style={[styles.box, animatedStyle]} />
  );
}
```
### Animation Callbacks
```typescript
import { runOnJS, runOnUI } from 'react-native-reanimated';
function AnimationWithCallbacks() {
  const translateX = useSharedValue(0);

### From `styling-patterns.md`

_Source topic: styling-patterns_

# React Native Styling Patterns
## StyleSheet Fundamentals
### Creating Styles
```typescript
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
// Typed styles for better IDE support
interface Styles {
  container: ViewStyle;
  title: TextStyle;
  image: ImageStyle;
}
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});
```
### Combining Styles
```typescript
import { StyleProp, ViewStyle } from 'react-native';
interface BoxProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'primary' | 'danger';
}
function Box({ style, variant = 'default' }: BoxProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        style, // Allow external style overrides
      ]}
    />
  );
}
const styles = StyleSheet.create({
  base: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  primary: {

### From `android-navigation.md`

_Source topic: android-navigation_

# Android Navigation Patterns

## Navigation Compose Basics

### Setup and Dependencies

```kotlin
// build.gradle.kts
dependencies {
    implementation("androidx.navigation:navigation-compose:2.7.7")
    // For type-safe navigation (recommended)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
}
```

### Basic Navigation

```kotlin
@Serializable
object Home

@Serializable
data class Detail(val itemId: String)

@Serializable
object Settings

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Home
    ) {
        composable<Home> {
...
```

### Navigation with Arguments
...


### From `compose-components.md`

_Source topic: compose-components_

# Jetpack Compose Component Library
## Lists and Collections
### Basic LazyColumn
```kotlin
@Composable
fun ItemList(
    items: List<Item>,
    onItemClick: (Item) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(
            items = items,
            key = { it.id }
        ) { item ->
            ItemRow(
                item = item,
                onClick = { onItemClick(item) }
            )
        }
    }
}
```
### Pull to Refresh
```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RefreshableList(
    items: List<Item>,
    isRefreshing: Boolean,
    onRefresh: () -> Unit
) {
    val pullToRefreshState = rememberPullToRefreshState()
    PullToRefreshBox(
        state = pullToRefreshState,
        isRefreshing = isRefreshing,
        onRefresh = onRefresh
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize()
        ) {
            items(items) { item ->
                ItemRow(item = item)
            }
        }
    }
}
```
### Swipe to Dismiss
```kotlin
@OptIn(ExperimentalMaterial3Api::class)
