import React, { useState } from 'react';
import { FaFacebook, FaTwitter, FaWhatsapp, FaTelegram, FaLink, FaCheck, FaTimes, FaShareAlt } from 'react-icons/fa';

const SocialShare = ({ title, url, description, image }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;
  const shareDescription = description || '';
  const shareImage = image || '';

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: '#1877f2',
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: '#1da1f2',
      shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      shareUrl: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      color: '#0088cc',
      shareUrl: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openShare = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
    setShowModal(false);
  };

  // مشاركة باستخدام Web Share API (للأجهزة المحمولة)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* زر المشاركة */}
      <button
        onClick={nativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
      >
        <FaShareAlt className="text-gray-400" />
        <span className="text-white text-sm">مشاركة</span>
      </button>

      {/* Modal المشاركة */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-white text-xl font-bold">مشاركة</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="p-5">
              {/* معاينة المشاركة */}
              <div className="bg-gray-800 rounded-xl p-3 mb-4">
                <div className="flex gap-3">
                  {image && (
                    <img src={image} alt={shareTitle} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm line-clamp-2">{shareTitle}</h4>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{shareDescription}</p>
                    <p className="text-gray-500 text-xs mt-1 truncate">{shareUrl}</p>
                  </div>
                </div>
              </div>

              {/* وسائل التواصل */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => openShare(platform.shareUrl)}
                    className="flex items-center gap-3 p-3 rounded-xl transition hover:scale-105"
                    style={{ backgroundColor: `${platform.color}20`, border: `1px solid ${platform.color}50` }}
                  >
                    <platform.icon className="text-xl" style={{ color: platform.color }} />
                    <span className="text-white text-sm">{platform.name}</span>
                  </button>
                ))}
              </div>

              {/* نسخ الرابط */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition"
              >
                {copied ? <FaCheck className="text-green-400" /> : <FaLink className="text-gray-400" />}
                <span className="text-white text-sm">{copied ? 'تم نسخ الرابط!' : 'نسخ الرابط'}</span>
              </button>

              {/* كود التضمين */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-gray-400 text-xs mb-2">كود التضمين (Embed)</p>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`<iframe src="${shareUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="${shareUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`);
                      alert('تم نسخ كود التضمين!');
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialShare;