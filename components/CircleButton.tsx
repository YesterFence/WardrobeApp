import { Pressable, StyleSheet, Text, View, } from 'react-native';

type Props = {
  onPress: () => void;
};

export default function CircleButton({ onPress }: Props) {
  return (
    <View style={styles.circleButtonContainer}>
      <Pressable style={styles.circleButton} onPress={onPress}>
        <Text style={styles.circleButtonText}>Add Tags</Text>
        {/* <MaterialIcons name="add" size={38} color="#25292e" /> */}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circleButtonContainer: {
    width: 84,
    height: 84,
    marginHorizontal: 60,
    borderWidth: 4,
    borderColor: '#ffd33d',
    borderRadius: 42,
    padding: 3,
  },
  circleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#fff',
  },
  circleButtonText: {
    color: '#25292e',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
