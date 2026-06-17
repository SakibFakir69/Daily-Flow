import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  DEFAULT_LIST_COLOR,
  DEFAULT_LIST_ICON,
  LIST_COLORS,
  LIST_ICONS,
} from '@/constants/list-presets';
import { Radius, Spacing } from '@/constants/theme';
import { listsRepo, type List } from '@/db';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  visible: boolean;
  /** Present when editing an existing list; null/undefined when creating. */
  list?: List | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Bottom-sheet style modal to create or edit a list (name + color + icon). */
export function ListEditorModal({ visible, list, onClose, onSaved }: Props) {
  const theme = useTheme();
  const editing = !!list;

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_LIST_COLOR);
  const [icon, setIcon] = useState<keyof typeof Ionicons.glyphMap>(DEFAULT_LIST_ICON);

  // Re-seed the form whenever the modal opens for a different list.
  useEffect(() => {
    if (visible) {
      setName(list?.name ?? '');
      setColor(list?.color ?? DEFAULT_LIST_COLOR);
      setIcon((list?.icon as keyof typeof Ionicons.glyphMap) ?? DEFAULT_LIST_ICON);
    }
  }, [visible, list]);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      if (editing && list) {
        await listsRepo.updateList(list.id, { name: name.trim(), color, icon });
      } else {
        await listsRepo.createList({ name: name.trim(), color, icon });
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error('[DailyFlow] Failed to save list:', error);
    }
  };

  const handleDelete = async () => {
    if (!list) return;
    try {
      await listsRepo.deleteList(list.id);
      onSaved();
      onClose();
    } catch (error) {
      console.error('[DailyFlow] Failed to delete list:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={styles.handle}>
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        </View>

        <ThemedText type="subtitle">{editing ? 'Edit list' : 'New list'}</ThemedText>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="List name"
          placeholderTextColor={theme.tabInactive}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          autoFocus={!editing}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <ThemedText type="small" themeColor="textSecondary">
          Color
        </ThemedText>
        <View style={styles.swatchRow}>
          {LIST_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="button"
              accessibilityLabel={`Color ${c}`}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && { borderColor: theme.text, borderWidth: 3 },
              ]}
            />
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          Icon
        </ThemedText>
        <View style={styles.iconRow}>
          {LIST_ICONS.map((ic) => (
            <Pressable
              key={ic}
              onPress={() => setIcon(ic)}
              accessibilityRole="button"
              accessibilityLabel={`Icon ${ic}`}
              style={[
                styles.iconButton,
                { backgroundColor: theme.backgroundElement },
                icon === ic && { backgroundColor: color },
              ]}>
              <Ionicons
                name={ic}
                size={20}
                color={icon === ic ? theme.background : theme.text}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          {editing ? (
            <Pressable onPress={handleDelete} hitSlop={8} accessibilityRole="button">
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Delete
              </ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[
              styles.saveButton,
              { backgroundColor: canSave ? theme.tint : theme.backgroundElement },
            ]}
            accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: canSave ? theme.background : theme.tabInactive }}>
              {editing ? 'Save' : 'Create'}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.three,
  },
  handle: {
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  saveButton: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
});
