import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  theme?: 'primary';
  onPress?: () => void;
  disabled?: boolean;
};

export default function Button({ label, theme, onPress, disabled = false }: Props) {
    if (theme === 'primary') {
        return (
            <View
              style={[
                styles.buttonContainer,
                { 
                  borderWidth: 4, 
                  borderColor: '#ffd33d', 
                  borderRadius: 18 },
              ]}>
              <Pressable
                style={[styles.button, { backgroundColor: '#fff', opacity: disabled ? 0.5 : 1 }]}
                onPress={onPress}
                disabled={disabled}
                >
                <FontAwesome name="picture-o" size={18} color="#25292e" style={styles.buttonIcon} />
                <Text style={[styles.buttonLabel, { color: '#25292e' }]}>{label}</Text>
              </Pressable>
            </View>
        );
    }
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.buttonLabel, disabled && styles.disabledText]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
    buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#6c6c6c',
  },
  disabledText: {
    color: '#ccc',
  },
});
