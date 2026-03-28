import React, { useState } from 'react';

const Tooltip = ({ data, side, children }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="bar-segment"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {hover && data && (
        <div className={`bar-tooltip ${side}`}>
          <div className="tooltip-title">{data.name}</div>
          <div className="tooltip-score">{data.score}/100 fit score</div>
          <div className="tooltip-reason">{data.reason}</div>
        </div>
      )}
    </div>
  );
};

const statusText = {
  idle: 'Ready',
  scanning: 'AI analysis in progress',
  complete: 'Recommendation ready',
  error: 'Analysis failed'
};

const TugOfWarBar = ({ comparison, onRemove }) => {
  const { query, leftOption, rightOption, results, status } = comparison;
  const leftData = results?.left || { name: leftOption.name, score: 50, reason: 'Awaiting analysis.' };
  const rightData = results?.right || { name: rightOption.name, score: 50, reason: 'Awaiting analysis.' };
  const winner = results?.winner || 'tie';
  const summary = results?.comparison_summary || 'Run the analysis to generate a recommendation.';
  const confidence = results?.confidence;
  const barWinnerLabel =
    winner === 'tie' ? 'Close call' : `${winner === 'left' ? leftData.name : rightData.name} leads`;

  return (
    <article className={`comparison-card status-${status}`}>
      <button className="remove-button" onClick={onRemove} aria-label={`Remove ${query}`}>
        x
      </button>

      <div className="comparison-head">
        <div>
          <p className="card-kicker">Use case</p>
          <h3 className="comparison-query">{query}</h3>
        </div>
        <div className="card-status-group">
          <span className={`winner-chip winner-${winner}`}>{barWinnerLabel}</span>
          <span className="card-status">{statusText[status]}</span>
        </div>
      </div>

      <p className="comparison-summary">{summary}</p>

      <div className="score-header">
        <div className="score-side">
          <span className="score-name">{leftData.name}</span>
          <span className="score-value">{leftData.score}</span>
        </div>
        <div className="score-middle">
          <span className="score-caption">Winner bar</span>
          {typeof confidence === 'number' && <span className="confidence-copy">{Math.round(confidence * 100)}% confidence</span>}
        </div>
        <div className="score-side align-right">
          <span className="score-value">{rightData.score}</span>
          <span className="score-name">{rightData.name}</span>
        </div>
      </div>

      <div className="score-bar-shell">
        <Tooltip data={leftData} side="left">
          <div
            className="score-fill left"
            style={{
              width: `${leftData.score}%`,
              background: `linear-gradient(90deg, ${leftOption.color}CC, ${leftOption.color})`
            }}
          />
        </Tooltip>
        <div className="score-divider" />
        <Tooltip data={rightData} side="right">
          <div
            className="score-fill right"
            style={{
              width: `${rightData.score}%`,
              background: `linear-gradient(270deg, ${rightOption.color}CC, ${rightOption.color})`
            }}
          />
        </Tooltip>
      </div>

      <div className="reasons-grid">
        <div className="reason-card">
          <p className="reason-label">Why {leftData.name}</p>
          <p className="reason-copy">{leftData.reason}</p>
        </div>
        <div className="reason-card">
          <p className="reason-label">Why {rightData.name}</p>
          <p className="reason-copy">{rightData.reason}</p>
        </div>
      </div>
    </article>
  );
};

export default TugOfWarBar;
