import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, FaDownload, FaCalendarAlt, FaEye, FaUsers, 
  FaFilm, FaStar, FaMoneyBillWave, FaArrowUp, FaArrowDown,
  FaMusic, FaTv, FaChartBar, FaChartPie, FaChartArea
} from 'react-icons/fa';

const AdvancedStatistics = () => {
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState({
    views: [],
    users: [],
    revenue: [],
    content: [],
    songs: [],
    series: []
  });
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('views');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = () => {
    setLoading(true);
    
    // تحميل البيانات من localStorage
    const moviesData = loadAllMovies();
    const seriesData = loadAllSeries();
    const songsData = loadAllSongs();
    const usersData = loadAllUsers();
    
    // معالجة البيانات للإحصائيات
    const viewsData = generateViewsData();
    const usersStats = generateUsersData();
    const revenueData = generateRevenueData();
    
    setStats({
      views: viewsData,
      users: usersStats,
      revenue: revenueData,
      content: moviesData,
      songs: songsData,
      series: seriesData
    });
    setLoading(false);
  };

  const loadAllMovies = () => {
    const categories = ['arabwood', 'hollywood', 'bollywood', 'european', 'asian'];
    let allMovies = [];
    categories.forEach(cat => {
      const data = localStorage.getItem(`cinewave_${cat}`);
      if (data) {
        const movies = JSON.parse(data);
        allMovies = [...allMovies, ...movies];
      }
    });
    return allMovies;
  };

  const loadAllSeries = () => {
    const categories = ['arabicseries', 'foreignseries', 'indianseries', 'turkishseries', 'koreanseries'];
    let allSeries = [];
    categories.forEach(cat => {
      const data = localStorage.getItem(`cinewave_${cat}`);
      if (data) {
        const series = JSON.parse(data);
        allSeries = [...allSeries, ...series];
      }
    });
    return allSeries;
  };

  const loadAllSongs = () => {
    const data = localStorage.getItem('cinewave_songs');
    return data ? JSON.parse(data) : [];
  };

  const loadAllUsers = () => {
    const data = localStorage.getItem('cinewave_users');
    return data ? JSON.parse(data) : [];
  };

  const generateViewsData = () => {
    const data = [];
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50000) + 10000,
        unique_users: Math.floor(Math.random() * 10000) + 2000,
      });
    }
    return data.reverse();
  };

  const generateUsersData = () => {
    const data = [];
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        new_users: Math.floor(Math.random() * 500) + 50,
        active_users: Math.floor(Math.random() * 5000) + 1000,
        premium_users: Math.floor(Math.random() * 1000) + 100,
      });
    }
    return data.reverse();
  };

  const generateRevenueData = () => {
    const data = [];
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 500,
        subscriptions: Math.floor(Math.random() * 100) + 10,
      });
    }
    return data.reverse();
  };

  const exportToCSV = () => {
    const data = stats[reportType];
    const headers = Object.keys(data[0] || {});
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${reportType}_${dateRange}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      stats: stats,
      dateRange: dateRange
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinewave_backup_stats_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalStats = {
    totalViews: stats.views.reduce((a, b) => a + b.views, 0),
    totalUsers: stats.users.reduce((a, b) => a + b.active_users, 0),
    totalRevenue: stats.revenue.reduce((a, b) => a + b.amount, 0),
    totalSubscriptions: stats.revenue.reduce((a, b) => a + b.subscriptions, 0),
    totalMovies: stats.content.length,
    totalSeries: stats.series.length,
    totalSongs: stats.songs.length,
    totalArtists: JSON.parse(localStorage.getItem('cinewave_song_artists') || '[]').length,
    avgRating: 4.6,
    viewsChange: '+15%',
    usersChange: '+8%',
    revenueChange: '+22%'
  };

  // حساب المحتوى الأكثر مشاهدة
  const topContent = [...stats.content, ...stats.series, ...stats.songs]
    .sort((a, b) => (b.views || b.rating || 0) - (a.views || a.rating || 0))
    .slice(0, 10);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaChartLine className="text-purple-400" /> إحصائيات متقدمة
        </h2>
        <div className="flex gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)} 
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="week">آخر 7 أيام</option>
            <option value="month">آخر 30 يوماً</option>
            <option value="year">آخر سنة</option>
          </select>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700">
              <FaDownload /> CSV
            </button>
            <button onClick={exportToJSON} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700">
              <FaDownload /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="إجمالي المشاهدات" value={totalStats.totalViews.toLocaleString()} change={totalStats.viewsChange} icon={FaEye} color="purple" />
        <StatCard title="المستخدمين النشطين" value={totalStats.totalUsers.toLocaleString()} change={totalStats.usersChange} icon={FaUsers} color="blue" />
        <StatCard title="الإيرادات" value={`$${totalStats.totalRevenue.toLocaleString()}`} change={totalStats.revenueChange} icon={FaMoneyBillWave} color="green" />
        <StatCard title="متوسط التقييم" value={totalStats.avgRating} change="+0.3" icon={FaStar} color="yellow" />
      </div>

      {/* إحصائيات المحتوى */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <FaFilm className="text-purple-400 text-2xl mx-auto mb-2" />
          <p className="text-gray-400 text-sm">الأفلام</p>
          <p className="text-white text-2xl font-bold">{totalStats.totalMovies}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <FaTv className="text-blue-400 text-2xl mx-auto mb-2" />
          <p className="text-gray-400 text-sm">المسلسلات</p>
          <p className="text-white text-2xl font-bold">{totalStats.totalSeries}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <FaMusic className="text-pink-400 text-2xl mx-auto mb-2" />
          <p className="text-gray-400 text-sm">الأغاني</p>
          <p className="text-white text-2xl font-bold">{totalStats.totalSongs}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <FaUsers className="text-green-400 text-2xl mx-auto mb-2" />
          <p className="text-gray-400 text-sm">الفنانين</p>
          <p className="text-white text-2xl font-bold">{totalStats.totalArtists}</p>
        </div>
      </div>

      {/* اختيار نوع التقرير */}
      <div className="flex gap-3 mb-6">
        {['views', 'users', 'revenue'].map(type => (
          <button 
            key={type} 
            onClick={() => setReportType(type)} 
            className={`px-4 py-2 rounded-lg transition ${reportType === type ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {type === 'views' ? 'المشاهدات' : type === 'users' ? 'المستخدمين' : 'الإيرادات'}
          </button>
        ))}
      </div>

      {/* جدول البيانات */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              {Object.keys(stats[reportType][0] || {}).map(key => (
                <th key={key} className="px-4 py-3 text-right text-white text-sm">
                  {key === 'date' ? 'التاريخ' :
                   key === 'views' ? 'المشاهدات' :
                   key === 'unique_users' ? 'مستخدمين فريدين' :
                   key === 'new_users' ? 'مستخدمين جدد' :
                   key === 'active_users' ? 'مستخدمين نشطين' :
                   key === 'premium_users' ? 'مستخدمين مميزين' :
                   key === 'amount' ? 'المبلغ ($)' :
                   key === 'subscriptions' ? 'اشتراكات جديدة' : key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats[reportType].map((row, idx) => (
              <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                {Object.values(row).map((value, i) => (
                  <td key={i} className="px-4 py-3 text-gray-300 text-sm">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* أعلى 10 محتوى */}
      <div className="mt-8">
        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
          <FaStar className="text-yellow-400" /> أعلى 10 محتوى مشاهدة
        </h3>
        <div className="space-y-2">
          {topContent.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 font-bold text-lg w-8">#{idx + 1}</span>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.genre || 'غير مصنف'} • {item.year || '-'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-purple-400 font-bold">{item.views?.toLocaleString() || item.rating || 0} {item.views ? 'مشاهدة' : 'تقييم'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change.startsWith('+');
  
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
  };
  
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className={`text-${color}-400`} />
        </div>
        <span className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
          {change}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm">{title}</h3>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default AdvancedStatistics;