export default function BrandMark({ onClick, href = '#', className = '', compact = false }) {
  const labelClassName = compact ? 'fs-6' : 'fs-5 fw-bold'

  const content = (
    <>
      <svg className="bi bi-circle-square me-2" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M0 6a6 6 0 1 1 12 0A6 6 0 0 1 0 6"></path>
        <path d="M12.93 5h1.57a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1.57a7 7 0 0 1-1-.22v1.79A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 4h-1.79q.145.486.22 1"></path>
      </svg>
      <span className={labelClassName}>TransitOps</span>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`text-decoration-none link-body-emphasis d-inline-flex align-items-center brand-button ${className}`}>
        {content}
      </button>
    )
  }

  return (
    <a href={href} className={`text-decoration-none link-body-emphasis d-inline-flex align-items-center ${className}`}>
      {content}
    </a>
  )
}