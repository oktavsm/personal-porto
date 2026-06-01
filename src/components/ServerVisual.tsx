export function ServerVisual() {
  return (
    <div className="server-visual" aria-label="Decorative core server visual">
      <div className="cable c1" />
      <div className="cable c2" />
      <div className="cable c3" />
      <div className="cable c4" />
      <div className="rack">
        <div className="rack-label">
          <span>CORE-NET</span>
          <span>ACTIVE</span>
        </div>
        {[0, 1, 2, 3, 4].map((unit) => (
          <div className={`server-unit ${unit === 1 || unit === 3 ? "large" : ""}`} key={unit}>
            <div className="lights">
              <span className="light" />
              {unit !== 3 ? <span className="light" /> : null}
              {unit === 0 || unit === 2 ? <span className="light" /> : null}
            </div>
            <div className="ports">
              {Array.from({ length: 8 }).map((_, index) => (
                <span className="port" key={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
