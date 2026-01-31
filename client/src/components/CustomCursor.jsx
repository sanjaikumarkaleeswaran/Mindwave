import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position values
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Spring physics for smooth movement
    const springConfig = { damping: 25, stiffness: 700 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            mouseX.set(e.clientX - 16); // Center the cursor (32px width / 2)
            mouseY.set(e.clientY - 16);
        };

        const handleMouseOver = (e) => {
            // Check if the hovered element is interactive
            const target = e.target;
            const isClickable =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('cursor-pointer') ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovered(!!isClickable);
        };

        const handleMouseOut = () => {
            setIsHovered(false);
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);
        // window.addEventListener('mouseout', handleMouseOut); // mouseover bubbles, so we update on every over

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            // window.removeEventListener('mouseout', handleMouseOut);
        };
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
            style={{
                x: cursorX,
                y: cursorY,
            }}
            animate={{
                scale: isHovered ? 2.5 : 1,
                opacity: 1,
            }}
            transition={{
                scale: { duration: 0.15 },
                opacity: { duration: 0.2 }
            }}
        />
    );
};

export default CustomCursor;
