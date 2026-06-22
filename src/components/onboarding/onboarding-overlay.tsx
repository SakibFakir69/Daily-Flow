import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { hapticComplete, hapticSelection } from '@/lib/haptics';
import { ONBOARDING_SLIDES, type OnboardingSlide } from './slides';

/**
 * Full-screen first-run "motion overview": a swipeable, animated walkthrough of
 * what DailyFlow does. Mounted over the app (see `_layout`) when the onboarding
 * has never been completed; calls `onDone` once the user finishes or skips.
 */
export function OnboardingOverlay({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  // Looping "liveliness" drivers shared by every slide: a gentle bob and an
  // expanding glow ring. Started once; run for the overlay's lifetime.
  const bob = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [bob, pulse]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const lastIndex = ONBOARDING_SLIDES.length - 1;

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex((prev) => {
        if (next !== prev) hapticSelection();
        return next;
      });
    },
    [width]
  );

  const goNext = useCallback(() => {
    if (index >= lastIndex) {
      hapticComplete();
      onDone();
      return;
    }
    const target = index + 1;
    scrollRef.current?.scrollTo({ x: target * width, animated: true });
    setIndex(target);
    hapticSelection();
  }, [index, lastIndex, onDone, width]);

  const onSkip = useCallback(() => {
    hapticSelection();
    onDone();
  }, [onDone]);

  const isLast = index === lastIndex;

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(220)}
      style={[styles.root, { backgroundColor: theme.background }]}
      accessibilityViewIsModal>
      <Pressable
        onPress={onSkip}
        hitSlop={10}
        style={[styles.skip, { top: insets.top + Spacing.two }]}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.skip')}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('onboarding.skip')}
        </ThemedText>
      </Pressable>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}>
        {ONBOARDING_SLIDES.map((slide, i) => (
          <Slide
            key={slide.key}
            slide={slide}
            index={i}
            width={width}
            scrollX={scrollX}
            bob={bob}
            pulse={pulse}
            title={t(slide.titleKey)}
            body={t(slide.bodyKey)}
            fallbackTint={theme.tint}
          />
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.dots} accessibilityElementsHidden>
          {ONBOARDING_SLIDES.map((slide, i) => (
            <Dot key={slide.key} index={i} width={width} scrollX={scrollX} color={theme.tint} />
          ))}
        </View>

        <Pressable
          onPress={goNext}
          style={[styles.cta, { backgroundColor: theme.tint }]}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('onboarding.start') : t('onboarding.next')}>
          <ThemedText type="default" style={[styles.ctaLabel, { color: theme.background }]}>
            {isLast ? t('onboarding.start') : t('onboarding.next')}
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

interface SlideProps {
  slide: OnboardingSlide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  bob: SharedValue<number>;
  pulse: SharedValue<number>;
  title: string;
  body: string;
  fallbackTint: string;
}

function Slide({ slide, index, width, scrollX, bob, pulse, title, body, fallbackTint }: SlideProps) {
  const theme = useTheme();
  const accent = slide.tint ?? fallbackTint;
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  // Icon: scales up + parallaxes slower than the page, and bobs continuously.
  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
    const parallax = interpolate(
      scrollX.value,
      inputRange,
      [width * 0.25, 0, -width * 0.25],
      Extrapolation.CLAMP
    );
    const bobY = interpolate(bob.value, [0, 1], [-7, 7]);
    return { transform: [{ translateX: parallax }, { translateY: bobY }, { scale }] };
  });

  // Glow ring behind the icon: expands and fades out, on a loop.
  const ringStyle = useAnimatedStyle(() => {
    const scale = 1 + pulse.value * 0.35;
    const opacity = (1 - pulse.value) * 0.4;
    return { opacity, transform: [{ scale }] };
  });

  // Text block: fades in and rises as the slide reaches center.
  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [36, 0, 36], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.art}>
        <Animated.View
          style={[styles.ring, { borderColor: accent, backgroundColor: accent }, ringStyle]}
        />
        <Animated.View
          style={[styles.iconCircle, { backgroundColor: accent }, iconStyle]}>
          <Ionicons name={slide.icon} size={60} color="#FFFFFF" />
        </Animated.View>
      </View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.body}>
          {body}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  width,
  scrollX,
  color,
}: {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  color: string;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const ICON_SIZE = 132;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  skip: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 2,
    padding: Spacing.two,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  art: {
    width: ICON_SIZE * 1.6,
    height: ICON_SIZE * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  ring: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  body: {
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    height: 8,
    borderRadius: Radius.pill,
  },
  cta: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontWeight: '700',
  },
});
