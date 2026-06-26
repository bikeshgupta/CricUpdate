import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMatch } from '../store/matchStore';
import { teamById } from '../scoring/match';
import type { Match } from '../scoring/types';
import { AccentButton, GhostButton, GlassCard, MicroLabel } from './ui';
import CoinToss from './CoinToss';
import PlayerPicker from './PlayerPicker';

type Step = 'call' | 'flip' | 'decision' | 'openers';

export default function TossFlow({ match }: { match: Match }) {
  const setToss = useMatch((s) => s.setToss);
  const startInnings1 = useMatch((s) => s.startInnings1);

  const [step, setStep] = useState<Step>('call');
  const [callingTeamId, setCallingTeamId] = useState(match.teamA.id);
  const [call, setCall] = useState<'heads' | 'tails'>('heads');
  const [outcome, setOutcome] = useState<'heads' | 'tails'>('heads');
  const [flipKey, setFlipKey] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'bat' | 'bowl' | null>(null);

  // openers
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);

  const callingTeam = teamById(match, callingTeamId);
  const otherTeam = match.teamA.id === callingTeamId ? match.teamB : match.teamA;

  const flip = () => {
    const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    setOutcome(result);
    setStep('flip');
    setFlipKey((k) => k + 1);
  };

  const onRest = () => {
    const won = call === outcome ? callingTeamId : otherTeam.id;
    setWinnerId(won);
    setTimeout(() => setStep('decision'), 500);
  };

  const confirmDecision = (d: 'bat' | 'bowl') => {
    if (!winnerId) return;
    setDecision(d);
    setToss({
      callingTeamId,
      call,
      outcome,
      winnerTeamId: winnerId,
      decision: d,
    });
    setStep('openers');
  };

  // who bats first
  const winner = winnerId ? teamById(match, winnerId) : null;
  const loser = winnerId ? (winnerId === match.teamA.id ? match.teamB : match.teamA) : null;
  const battingFirst = decision === 'bat' ? winner : loser;
  const bowlingFirst = battingFirst?.id === match.teamA.id ? match.teamB : match.teamA;

  const openersReady = strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId;

  return (
    <div className="space-y-5">
      {step === 'call' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <GlassCard className="space-y-3">
            <MicroLabel>Who calls the toss?</MicroLabel>
            <div className="grid grid-cols-2 gap-2">
              {[match.teamA, match.teamB].map((t) => (
                <GhostButton key={t.id} active={callingTeamId === t.id} onClick={() => setCallingTeamId(t.id)}>
                  {t.name}
                </GhostButton>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="space-y-3">
            <MicroLabel>{callingTeam.name} calls</MicroLabel>
            <div className="grid grid-cols-2 gap-2">
              <GhostButton active={call === 'heads'} onClick={() => setCall('heads')}>
                Heads
              </GhostButton>
              <GhostButton active={call === 'tails'} onClick={() => setCall('tails')}>
                Tails
              </GhostButton>
            </div>
          </GlassCard>
          <AccentButton onClick={flip} className="w-full">
            Flip the coin
          </AccentButton>
        </motion.div>
      )}

      {(step === 'flip' || step === 'decision') && (
        <div className="text-center">
          <CoinToss outcome={outcome} flipKey={flipKey} onRest={onRest} />
          {step === 'decision' && winner && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 space-y-4"
            >
              <div>
                <div className="text-lg font-bold text-accent">It’s {outcome}!</div>
                <div className="mt-1 text-sm text-ink-muted">
                  <span className="font-semibold text-ink">{winner.name}</span> won the toss
                </div>
              </div>
              <GlassCard className="space-y-3">
                <MicroLabel>{winner.name} will…</MicroLabel>
                <div className="grid grid-cols-2 gap-2">
                  <AccentButton onClick={() => confirmDecision('bat')}>Bat</AccentButton>
                  <GhostButton onClick={() => confirmDecision('bowl')}>Bowl</GhostButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      )}

      {step === 'openers' && battingFirst && bowlingFirst && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="text-center text-sm text-ink-muted">
            <span className="font-semibold text-ink">{battingFirst.name}</span> bat first
          </div>

          <GlassCard className="space-y-3">
            <MicroLabel>Striker</MicroLabel>
            <PlayerPicker
              players={battingFirst.players}
              selectedId={strikerId}
              excludeIds={nonStrikerId ? [nonStrikerId] : []}
              onSelect={setStrikerId}
            />
          </GlassCard>

          <GlassCard className="space-y-3">
            <MicroLabel>Non-striker</MicroLabel>
            <PlayerPicker
              players={battingFirst.players}
              selectedId={nonStrikerId}
              excludeIds={strikerId ? [strikerId] : []}
              onSelect={setNonStrikerId}
            />
          </GlassCard>

          <GlassCard className="space-y-3">
            <MicroLabel>Opening bowler · {bowlingFirst.name}</MicroLabel>
            <PlayerPicker players={bowlingFirst.players} selectedId={bowlerId} onSelect={setBowlerId} />
          </GlassCard>

          <div className="sticky bottom-4">
            <AccentButton
              disabled={!openersReady}
              onClick={() => startInnings1(strikerId!, nonStrikerId!, bowlerId!)}
              className="w-full"
            >
              Start innings →
            </AccentButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
