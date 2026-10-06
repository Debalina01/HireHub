import React, { useState, useEffect, useMemo } from 'react';
import {
  getDomainLogoFallbackChain,
  cacheDomainLogo,
  resolveCompanySync,
  resolveCompanyLogo
} from '../utils/companyLogo';

export default function CompanyLogo({
  logo,
  company = '',
  companyDomain = '',
  className = 'company-logo-img',
  alt = '',
  style = {},
  fallbackIcon = null
}) {
  const cleanDomain = (companyDomain || '').trim().toLowerCase();

  const sources = useMemo(() => {
    return getDomainLogoFallbackChain(cleanDomain, logo);
  }, [cleanDomain, logo]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [asyncResolvedLogo, setAsyncResolvedLogo] = useState('');

  
  useEffect(() => {
    setSourceIndex(0);
    setHasError(sources.length === 0 && !asyncResolvedLogo && !company);
    setIsLoaded(false);

    
    if (sources.length === 0 && !asyncResolvedLogo && company && company.trim()) {
      const sync = resolveCompanySync(company);
      if (sync && sync.logo) {
        setAsyncResolvedLogo(sync.logo);
      } else {
        let isMounted = true;
        resolveCompanyLogo(company)
          .then((res) => {
            if (isMounted && res && res.logo) {
              setAsyncResolvedLogo(res.logo);
              setHasError(false);
            } else if (isMounted) {
              setHasError(true);
            }
          })
          .catch(() => {
            if (isMounted) setHasError(true);
          });

        return () => {
          isMounted = false;
        };
      }
    }
  }, [sources, company, asyncResolvedLogo]);

 
  const effectiveSources = useMemo(() => {
    const list = [...sources];
    if (asyncResolvedLogo && !list.includes(asyncResolvedLogo)) {
      list.unshift(asyncResolvedLogo);
    }
    return list;
  }, [sources, asyncResolvedLogo]);

  const handleImageError = () => {
    if (sourceIndex < effectiveSources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    const activeUrl = effectiveSources[sourceIndex];
    if (cleanDomain && activeUrl) {
      cacheDomainLogo(cleanDomain, activeUrl);
    }
  };

  const renderFallback = () => {
    if (fallbackIcon) {
      return (
        <div
          className="company-logo-icon-fallback"
          style={style}
          aria-label={company || 'Icon'}
        >
          {fallbackIcon}
        </div>
      );
    }

    const raw = (company || '').trim() || cleanDomain || '?';
    const letter = raw.charAt(0).toUpperCase();

    return (
      <div
        className="company-logo-fallback"
        style={style}
        aria-label={company || 'Company'}
      >
        {letter}
      </div>
    );
  };

  if (hasError || effectiveSources.length === 0) {
    return renderFallback();
  }

  const currentSrc = effectiveSources[sourceIndex];

  return (
    <img
      src={currentSrc}
      alt={alt || `${company || 'Company'} logo`}
      className={className}
      style={{
        opacity: isLoaded ? 1 : 0.85,
        filter: 'none',
        mixBlendMode: 'normal',
        imageRendering: '-webkit-optimize-contrast',
        objectFit: 'contain',
        display: 'block',
        ...style
      }}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="eager"
      decoding="async"
    />
  );
}
