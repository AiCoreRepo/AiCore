import {
  buildAuraAttributesMetadata,
  collectAuraAvatarHistoryImageUrls,
  createAuraAvatarHistoryEntry,
  normalizeAuraAvatarHistory,
} from './aura-avatar-history.util';

describe('aura avatar history util', () => {
  it('creates a fallback history entry for legacy aura records', () => {
    const result = normalizeAuraAvatarHistory({
      modelUrl: 'https://example.com/latest-avatar.png',
      tryOnModelUrl: 'https://example.com/latest-avatar-tryon.png',
      generatedAvatarUrls: ['https://example.com/latest-avatar.png'],
      currentAttributes: {
        body_shape: 'hourglass',
        body_size: 'medium',
        skin_tone: 'medium',
      },
      createdAt: '2026-03-17T08:00:00.000Z',
      updatedAt: '2026-03-18T08:00:00.000Z',
      attributesJson: {
        type: 'generated',
        generatedAt: '2026-03-18T08:00:00.000Z',
        attributes: {
          body_shape: 'hourglass',
          body_size: 'medium',
          skin_tone: 'medium',
        },
      },
    });

    expect(result.avatarHistory).toHaveLength(1);
    expect(result.selectedAvatar).toMatchObject({
      model_url: 'https://example.com/latest-avatar.png',
      tryon_model_url: 'https://example.com/latest-avatar-tryon.png',
      generation_type: 'generated',
    });
  });

  it('preserves the selected avatar id inside metadata', () => {
    const firstAvatar = createAuraAvatarHistoryEntry({
      modelUrl: 'https://example.com/avatar-1.png',
      tryOnModelUrl: 'https://example.com/avatar-1-tryon.png',
      source: 'creation',
      generationType: 'generated',
      createdAt: '2026-03-17T08:00:00.000Z',
      attributes: { body_shape: 'hourglass' },
    });
    const secondAvatar = createAuraAvatarHistoryEntry({
      modelUrl: 'https://example.com/avatar-2.png',
      tryOnModelUrl: 'https://example.com/avatar-2-tryon.png',
      source: 'recreation',
      generationType: 'generated',
      createdAt: '2026-03-18T08:00:00.000Z',
      attributes: { body_shape: 'pear' },
    });

    const metadata = buildAuraAttributesMetadata(
      { previousKey: 'keep-me' },
      [firstAvatar, secondAvatar],
      secondAvatar,
    );

    expect(metadata).toMatchObject({
      previousKey: 'keep-me',
      selected_avatar_id: secondAvatar.avatar_id,
      type: 'generated',
      attributes: { body_shape: 'pear' },
    });
  });

  it('collects both avatar and try-on image urls from history', () => {
    const avatar = createAuraAvatarHistoryEntry({
      modelUrl: 'https://example.com/avatar-1.png',
      tryOnModelUrl: 'https://example.com/avatar-1-tryon.png',
      source: 'creation',
      generationType: 'generated',
      createdAt: '2026-03-17T08:00:00.000Z',
      attributes: {},
    });

    expect(collectAuraAvatarHistoryImageUrls([avatar])).toEqual([
      'https://example.com/avatar-1.png',
      'https://example.com/avatar-1-tryon.png',
    ]);
  });
});
