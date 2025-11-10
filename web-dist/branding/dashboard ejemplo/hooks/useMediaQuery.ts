import * as React from 'react';

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    // Ensure window is defined for SSR environments
    if (typeof window === 'undefined') {
        return;
    }
      
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    
    try {
        media.addEventListener('change', listener);
    } catch (e) {
        media.addListener(listener); // Deprecated
    }
    
    return () => {
        try {
            media.removeEventListener('change', listener);
        } catch (e) {
            media.removeListener(listener); // Deprecated
        }
    };
  }, [matches, query]);

  return matches;
};

export default useMediaQuery;