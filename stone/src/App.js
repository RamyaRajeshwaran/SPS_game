import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [winnerDetails, setWinnerDetails] = useState([]);
  const [gameState, setGameState] = useState({
    player1: '',
    player2: '',
    rounds: [],
    gameStarted: false,
    gameOver: false,
    currentRound: 1,
    player1Choice: '',
    player2Choice: '',
    gameId: null,
    player1Score: 0,
    player2Score: 0,
  });

  useEffect(() => {
    fetchWinnerDetails();
  }, []);

  const fetchWinnerDetails = async () => {
    try {
      if (gameState.gameId) { 
        const response = await axios.get(`http://localhost:5000/api/games/${gameState.gameId}/winner-details`);
        setWinnerDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching winner details:', error);
    }
  };

  useEffect(() => {
    if (gameState.currentRound > 6) {
      setGameState(prevState => ({ ...prevState, gameOver: true }));
    }
  }, [gameState.currentRound]);

  const startGame = async () => {
    const { player1, player2 } = gameState;
    if (player1.trim() === '' || player2.trim() === '') {
      alert('Please enter names for both players.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/games', { player1, player2 });
      const { data } = response;
      setGameState(prevState => ({
        ...prevState,
        gameId: data.id,
        gameStarted: true,
        currentRound: 1,
        rounds: [],
        player1Choice: '',
        player2Choice: '',
        gameOver: false,
        player1Score: 0, 
        player2Score: 0,
      }));
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please check your network connection and try again.');
    }
  };

  const handlePlayerChoice = (player, choice) => {
    setGameState(prevState => ({
      ...prevState,
      [`${player}Choice`]: choice,
    }));
  };

  const determineRoundWinner = (choice1, choice2) => {
    if (choice1 === choice2) {
      return 'tie';
    } else if (
      (choice1 === 'stone' && choice2 === 'scissors') ||
      (choice1 === 'scissors' && choice2 === 'paper') ||
      (choice1 === 'paper' && choice2 === 'stone')
    ) {
      return 'player1';
    } else {
      return 'player2';
    }
  };

  const determineWinner = async () => {
    const { player1Choice, player2Choice, gameId, currentRound } = gameState;
    if (player1Choice === '' || player2Choice === '') {
      alert('Both players need to make a selection.');
      return;
    }

    const winner = determineRoundWinner(player1Choice, player2Choice);

    try {
      await axios.put(`http://localhost:5000/api/games/${gameId}`, {
        round: currentRound,
        player1Choice,
        player2Choice,
        winner
      });

      if (winner === 'player1') {
        setGameState(prevState => ({ ...prevState, player1Score: prevState.player1Score + 1 }));
      } else if (winner === 'player2') {
        setGameState(prevState => ({ ...prevState, player2Score: prevState.player2Score + 1 }));
      }

      setGameState(prevState => ({
        ...prevState,
        rounds: [...prevState.rounds, { round: currentRound, player1: prevState.player1, player2: prevState.player2, winner }],
        currentRound: currentRound + 1,
        player1Choice: '',
        player2Choice: '',
        gameOver: currentRound === 6
      }));

      fetchWinnerDetails();
    } catch (error) {
      console.error('Error determining winner:', error);
      alert('Failed to determine winner. Please check your network connection and try again.');
    }
  };

  return (
    <div className="App">
      <h1 className='heading'>Stone Paper Scissors Game</h1>
      {!gameState.gameStarted && (
        <div className='inputbox'>
          <input type="text" placeholder="Player 1 Name" value={gameState.player1} onChange={e => setGameState(prevState => ({ ...prevState, player1: e.target.value }))} />
          <input type="text" placeholder="Player 2 Name" value={gameState.player2} onChange={e => setGameState(prevState => ({ ...prevState, player2: e.target.value }))} />
          <button onClick={startGame}>Start Game</button>
        </div>
      )}
      {gameState.gameStarted && !gameState.gameOver && gameState.currentRound <= 6 && (
        <div className="choices">
          <h2>{gameState.player1}'s Turn:</h2>
          <button onClick={() => handlePlayerChoice('player1', 'stone')}>Stone</button>
          <button onClick={() => handlePlayerChoice('player1', 'paper')}>Paper</button>
          <button onClick={() => handlePlayerChoice('player1', 'scissors')}>Scissors</button>
          <h2>{gameState.player2}'s Turn:</h2>
          <button onClick={() => handlePlayerChoice('player2', 'stone')}>Stone</button>
          <button onClick={() => handlePlayerChoice('player2', 'paper')}>Paper</button>
          <button onClick={() => handlePlayerChoice('player2', 'scissors')}>Scissors</button>

          <button onClick={determineWinner}>Submit</button>

          <div className="rounds">
            {gameState.rounds.map((round, index) => (
              <div key={index} className="round">
                <h5>
                  Round {round.round}: {round.player1} vs {round.player2} - Winner: {round.winner === 'tie' ? 'Tie' : (round.winner === 'player1' ? gameState.player1 : gameState.player2)}
                </h5>
              </div>
            ))}
          </div>
        </div>
      )}
      {gameState.gameOver && (
        <div className="scoreboard">
          <h2>Game Over!</h2>
          <h3>Final Scores:</h3>
          <h5>{gameState.player1}: {gameState.player1Score} - {gameState.player2}: {gameState.player2Score}</h5>
          <h3>Winner</h3>
          <h5>{gameState.player1Score === gameState.player2Score ? 'Tie' : (gameState.player1Score > gameState.player2Score ? gameState.player1 : gameState.player2)}</h5>
          <div className='winner-details'>
            <h3>Winner Details</h3>
            <table className='table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {winnerDetails.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.id}</td>
                    <td>{detail.player1}</td>
                    <td>{detail.player2}</td>
                    <td>{detail.winner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
