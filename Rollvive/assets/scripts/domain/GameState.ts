export enum GameState {
    Boot = 'Boot',
    Title = 'Title',
    ProfessionSelect = 'ProfessionSelect',
    BattleIntro = 'BattleIntro',
    Battle = 'Battle',
    WaveClear = 'WaveClear',
    RollDraft = 'RollDraft',
    Pause = 'Pause',
    Result = 'Result',
}

export const GameEvent = {
    StateChanged: 'game:state-changed',
    RunStarted: 'run:started',
    RunEnded: 'run:ended',
    WaveStarted: 'wave:started',
    WaveCleared: 'wave:cleared',
    PlayerDamaged: 'player:damaged',
    PlayerDied: 'player:died',
    EnemyDamaged: 'enemy:damaged',
    EnemyDied: 'enemy:died',
    DraftChanged: 'roll:draft-changed',
    DraftRefreshRequested: 'roll:draft-refresh-requested',
    RewardedAdRefreshRequested: 'ad:rewarded-refresh-requested',
    HexPicked: 'roll:hex-picked',
} as const;

export type GameEventName = (typeof GameEvent)[keyof typeof GameEvent];

export interface StateChangedEvent {
    type: typeof GameEvent.StateChanged;
    from: GameState;
    to: GameState;
}

export const ALLOWED_GAME_STATE_TRANSITIONS: Readonly<Record<GameState, readonly GameState[]>> = {
    [GameState.Boot]: [GameState.Title],
    [GameState.Title]: [GameState.ProfessionSelect],
    [GameState.ProfessionSelect]: [GameState.BattleIntro],
    [GameState.BattleIntro]: [GameState.Battle],
    [GameState.Battle]: [GameState.WaveClear, GameState.Result, GameState.Pause],
    [GameState.WaveClear]: [GameState.RollDraft],
    [GameState.RollDraft]: [GameState.BattleIntro],
    [GameState.Pause]: [GameState.Battle, GameState.Title],
    [GameState.Result]: [GameState.Title, GameState.ProfessionSelect],
};

export function canTransitionGameState(from: GameState, to: GameState): boolean {
    return ALLOWED_GAME_STATE_TRANSITIONS[from].indexOf(to) >= 0;
}

export function createStateChangedEvent(from: GameState, to: GameState): StateChangedEvent {
    if (!canTransitionGameState(from, to)) {
        throw new Error(`Invalid game state transition: ${from} -> ${to}`);
    }

    return {
        type: GameEvent.StateChanged,
        from,
        to,
    };
}
