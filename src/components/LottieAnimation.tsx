import LottieView from 'lottie-react-native';
import React from 'react';
import { View } from 'react-native';

interface LottieAnimationProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  source,
  autoPlay = true,
  loop = true,
  style,
}) => {
  return (
    <View style={style}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
};
