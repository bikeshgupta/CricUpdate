import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMatch } from '../store/matchStore';
import { teamById } from '../scoring/match';
import type { Match } from '../scoring/types';
import { Button, SectionHeader, Segmented } from './ui';
import CoinToss from './CoinToss';
import PlayerPicker from './PlayerPicker';

type Step = 'start' | 'call' | 'flip' | 'decision' | 'manual' | 'openers';

export default function TossFlow({ match }: { match: Match }) {
  const setToss = useMatch((s) => s.setToss);
  const startInnings1 = useMatch((s) => s.startInnings1);

  const [step, setStep] = useState<Step>('start');
  const [callingTeamId, setCallingTeamId] = useState(match.teamA.id);
  const [call, setCall] = useState<'heads' | 'tails'>('heads');
  const [outcome, setOutcome] = useState<'heads' | 'tails'>('heads');
  const [flipKey, setFlipKey] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'bat' | 'bowl' | null>(null);

  // manual toss
  const [manualWinner, setManualWinner] = useState(match.teamA.id);
  const [manualDecision, setManualDecision] = useState<'bat' | 'bowl'>('bat');

  // openers
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);

  const otherTeam = match.teamA.id === callingTeamId ? match.teamB : match.teamA;

  const flip = () => {
    setOutcome(Math.random() < 0.5 ? 'heads' : 'tails');
    setStep('flip');
    setFlipKey((k) => k + 1);
  };

  const onRest = () => {
    const won = call === outcome ? callingTeamId : otherTeam.id;
    setWinnerId(won);
    setTimeout(() => setStep('decision'), 350);
  };

  const confirmDecision = (d: 'bat' | 'bowl') => {
    if (!winnerId) return;
    setDecision(d);
    setToss({ callingTeamId, call, outcome, winnerTeamId: winnerId, decision: d });
    setStep('openers');
  };

  const confirmManual = () => {
    setWinnerId(manualWinner);
    setDecision(manualDecision);
    setToss({ callingTeamId: manualWinner, call: 'heads', outcome: 'heads', winnerTeamId: manualWinner, decision: manualDecision });
    setStep('openers');
  };

  const winner = winnerId ? teamById(match, winnerId) : null;
  const loser = winnerId ? (winnerId === match.teamA.id ? match.teamB : match.teamA) : null;
  const battingFirst = decision === 'bat' ? winner : loser;
  const bowlingFirst = battingFirst?.id === match.teamA.id ? match.teamB : match.teamA;
  const openersReady = strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId;

  return (
    <div className="animate-fade-in">
      {step === 'start' && (
        <div className="space-y-3 px-4 py-6">
          <p className="text-center text-caption text-fg-muted">Do the toss, or set the result manually.</p>
          <Button variant="primary" block onClick={() => setStep('call')}>
            Flip the coin
          </Button>
          <Button variant="secondary" block onClick={() => setStep('manual')}>
            Set toss manually
          </Button>
        </div>
      )}

      {step === 'manual' && (
        <div className="space-y-4 px-4 py-4">
          <div>
            <SectionHeader>Toss won by</SectionHeader>
            <Segmented
              options={[
                { value: match.teamA.id, label: match.teamA.name },
                { value: match.teamB.id, label: match.teamB.name },
              ]}
              value={manualWinner}
              onChange={setManualWinner}
            />
          </div>
          <div>
            <SectionHeader>Elected to</SectionHeader>
            <Segmented
              options={[
                { value: 'bat', label: 'Bat' },
                { value: 'bowl', label: 'Bowl' },
              ]}
              value={manualDecision}
              onChange={setManualDecision}
            />
          </div>
          <Button variant="primary" block onClick={confirmManual}>
            Confirm
          </Button>
          <button onClick={() => setStep('start')} className="block w-full text-center text-caption text-fg-muted">
            Back
          </button>
        </div>
      )}

      {step === 'call' && (
        <div className="space-y-4 px-4 py-4">
          <div>
            <SectionHeader>Who calls?</SectionHeader>
            <Segmented
              options={[
                { value: match.teamA.id, label: match.teamA.name },
                { value: match.teamB.id, label: match.teamB.name },
              ]}
              value={callingTeamId}
              onChange={setCallingTeamId}
            />
          </div>
          <div>
            <SectionHeader>Call</SectionHeader>
            <Segmented
              options={[
                { value: 'heads', label: 'Heads' },
                { value: 'tails', label: 'Tails' },
              ]}
              value={call}
              onChange={setCall}
            />
          </div>
          <Button variant="primary" block onClick={flip}>
            Flip the coin
          </Button>
        </div>
      )}

      {(step === 'flip' || step === 'decision') && (
        <div className="px-4 py-6 text-center">
          <CoinToss outcome={outcome} flipKey={flipKey} onRest={onRest} />
          {step === 'decision' && winner && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="mt-4 space-y-4">
              <div>
                <div className="text-body font-semibold text-accent">It&apos;s {outcome}</div>
                <div className="mt-0.5 text-caption text-fg-muted">
                  <span className="text-fg">{winner.name}</span> won the toss
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={() => confirmDecision('bat')}>Bat</Button>
                <Button variant="secondary" onClick={() => confirmDecision('bowl')}>Bowl</Button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {step === 'openers' && battingFirst && bowlingFirst && (
        <div className="animate-fade-in">
          <div className="border-b border-line px-4 py-2.5 text-caption text-fg-muted">
            <span className="text-fg">{battingFirst.name}</span> bat first
          </div>
          <SectionHeader>Striker</SectionHeader>
          <div className="px-4">
            <PlayerPicker players={battingFirst.players} selectedId={strikerId} excludeIds={nonStrikerId ? [nonStrikerId] : []} onSelect={setStrikerId} />
          </div>
          <SectionHeader>Non-striker</SectionHeader>
          <div className="px-4">
            <PlayerPicker players={battingFirst.players} selectedId={nonStrikerId} excludeIds={strikerId ? [strikerId] : []} onSelect={setNonStrikerId} />
          </div>
          <SectionHeader>Opening bowler · {bowlingFirst.name}</SectionHeader>
          <div className="px-4">
            <PlayerPicker players={bowlingFirst.players} selectedId={bowlerId} onSelect={setBowlerId} />
          </div>
          <div className="sticky bottom-0 mt-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <Button variant="primary" block disabled={!openersReady} onClick={() => startInnings1(strikerId!, nonStrikerId!, bowlerId!)}>
              Start innings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
