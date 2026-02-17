export const Hero = () => {
    // Video hosted on Cloudinary for better performance and smaller bundle size
    const videoUrl = "https://res.cloudinary.com/dxfxicebq/video/upload/v1771164261/IMG_4859_sgqnkj.mp4";

    return (
        <section className="w-full bg-[#F8F4EC]">
            {/* Full-Frame Video with Enhanced Quality */}
            <div className="w-full relative">
                {/* Subtle Gradient Overlay for Premium Look */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none z-10"></div>

                <video
                    src={videoUrl}
                    className="w-full h-auto block"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    aria-label="Premium Fashion Collection Video"
                    style={{
                        objectFit: 'contain',
                        filter: 'contrast(1.05) saturate(1.1) brightness(1.02)',
                    }}
                />
            </div>
        </section>
    );
};
