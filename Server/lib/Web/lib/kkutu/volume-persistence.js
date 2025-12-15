/**
 * Volume Settings Persistence Module
 * Handles saving and loading volume settings to/from localStorage
 */

// localStorage 키 정의
var VOLUME_STORAGE_KEYS = {
    BGM_VOLUME: 'kkutu_bgm_volume',
    EFFECT_VOLUME: 'kkutu_effect_volume',
    BGM_MUTE: 'kkutu_bgm_mute',
    EFFECT_MUTE: 'kkutu_effect_mute',
    SOUND_PACK: 'kkutu_sound_pack'
};

/**
 * 볼륨 설정 저장
 * @param {Object} settings - 저장할 설정 객체
 */
function saveVolumeSettings(settings) {
    try {
        if (settings.bgmVolume !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.BGM_VOLUME, settings.bgmVolume);
        }
        if (settings.effectVolume !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.EFFECT_VOLUME, settings.effectVolume);
        }
        if (settings.bgmMute !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.BGM_MUTE, settings.bgmMute);
        }
        if (settings.effectMute !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.EFFECT_MUTE, settings.effectMute);
        }
        if (settings.soundPack !== undefined) {
            localStorage.setItem(VOLUME_STORAGE_KEYS.SOUND_PACK, settings.soundPack);
        }
    } catch (e) {
        console.warn('Failed to save volume settings to localStorage:', e);
    }
}

/**
 * 볼륨 설정 불러오기
 * @returns {Object} 저장된 볼륨 설정
 */
function loadVolumeSettings() {
    try {
        var bgmVolume = localStorage.getItem(VOLUME_STORAGE_KEYS.BGM_VOLUME);
        var effectVolume = localStorage.getItem(VOLUME_STORAGE_KEYS.EFFECT_VOLUME);
        var bgmMute = localStorage.getItem(VOLUME_STORAGE_KEYS.BGM_MUTE);
        var effectMute = localStorage.getItem(VOLUME_STORAGE_KEYS.EFFECT_MUTE);
        var soundPack = localStorage.getItem(VOLUME_STORAGE_KEYS.SOUND_PACK);

        return {
            bgmVolume: bgmVolume !== null ? parseFloat(bgmVolume) : 1.0,
            effectVolume: effectVolume !== null ? parseFloat(effectVolume) : 1.0,
            bgmMute: bgmMute === 'true',
            effectMute: effectMute === 'true',
            soundPack: soundPack || ''
        };
    } catch (e) {
        console.warn('Failed to load volume settings from localStorage:', e);
        return {
            bgmVolume: 1.0,
            effectVolume: 1.0,
            bgmMute: false,
            effectMute: false,
            soundPack: ''
        };
    }
}

/**
 * 개별 볼륨 값 저장 (즉시 저장용)
 */
function saveBGMVolume(volume) {
    saveVolumeSettings({ bgmVolume: volume });
}

function saveEffectVolume(volume) {
    saveVolumeSettings({ effectVolume: volume });
}

function saveBGMMute(mute) {
    saveVolumeSettings({ bgmMute: mute });
}

function saveEffectMute(mute) {
    saveVolumeSettings({ effectMute: mute });
}

function saveSoundPack(pack) {
    saveVolumeSettings({ soundPack: pack });
}
