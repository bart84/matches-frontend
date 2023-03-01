import { Button, Card } from '@mui/material';
import axios, { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';

interface Team {
  teamName: string;
  goals: number;
}

interface Match {
  home: Team;
  away: Team;
}

interface Game {
  appState: string;
  matches: Match[];
}

type AppStatus = 'PRISTINE' | 'IN_PROGRESS' | 'FINISHED';

const countTotalGoals = (matchesData: Match[]) =>
  matchesData.reduce(
    (prevValue: number, value: Match) =>
      (prevValue += value.home.goals + value.away.goals),
    0
  );

export const MatchCard = () => {
  const [matches, setMatches] = useState({
    appState: 'PRISTINE',
    matches: []
  } as Game);
  const [totalGoals, setTotalGoals] = useState(0);
  const [appState, setAppState] = useState<AppStatus>('PRISTINE');
  const [listening, setListening] = useState(false);
  const [buttonLabel, setButtonLabel] = useState<string>('');

  useEffect(() => {
    if (!listening) {
      const events = new EventSource('http://localhost:3010/events');

      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data) as Game;

        console.log('## PARSED DATA ==> ', parsedData);

        setMatches(parsedData);
        setAppState(parsedData.appState as AppStatus);
      };

      setListening(true);
    }

    if (matches.matches) {
      setTotalGoals(countTotalGoals(matches.matches));
    }
  }, [listening, matches]);

  const triggerMatches = () => {
    axios
      .post(`http://localhost:3010/matches/start`)
      .then((res: AxiosResponse) => {
        console.log('## GOT MATCHES STATUS ==> ', res.data.status);
        const matchesState = res.data.status;
        setAppState(matchesState);
      });
  };

  const setLabel = (appState: string) => {
    console.log('## APP STATE ==> ', appState);
    switch (appState) {
      case 'PRISTINE':
        return 'START';
        break;
      case 'IN_PROGRESS':
        return 'FINISH';
        break;
      case 'FINISHED':
        return 'START';
        break;
      default:
        return 'START';
        break;
    }
  };

  useEffect(() => {
    console.log('## APPSTATE TRIGGERED');
    setButtonLabel(setLabel(appState));
  }, [appState]);

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexFlow: 'column',
        minWidth: '500px',
        minHeight: '200px'
      }}
    >
      <Button onClick={triggerMatches}>{buttonLabel}</Button>
      {matches.matches && matches.matches?.length > 0 ? (
        <div>
          {matches.matches.map((match: Match) => (
            <div key={`${match.home.teamName}-${match.away.teamName}`}>
              <div>{`${match.home.teamName} vs ${match.away.teamName}`}</div>
              <div>{`${match.home.goals} : ${match.away.goals}`}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div>
        <div>{`TOTAL GOALS: ${totalGoals}`}</div>
      </div>
    </Card>
  );
};
