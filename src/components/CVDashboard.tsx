'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CVRecord, CVApiResponse } from '@/types/cv';
import { Upload, Search, FileText, Users, TrendingUp, Eye, Copy, Download, CheckCircle, Loader2, RefreshCw, Volume2, VolumeX, Menu } from 'lucide-react';
import Modal from '@/components/ui/modal';
import CVUpload from './CVUpload';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';
import {
  playSearchSound,
  playToggleSound,
  playLoadingSound,
  playNewNotificationSound,
  playClickSound,
  playSuccessSound,
  playErrorSound,
  playModalOpenSound,
  playModalCloseSound,
  playHoverSound,
  enableNotificationSounds,
  isNotificationSoundEnabled,
  initializeNotificationSounds
} from '@/utils/notificationSound';

const CVDashboard = () => {
  const [records, setRecords] = useState<CVRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<CVRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortDirection,
        page: '1',
        pageSize: '1000',
      });

      const response = await fetch(`/api/cv?${params}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      
      const data: CVApiResponse = await response.json();
      setRecords(data.records);
      setTotalRecords(data.totalRecords);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeNotificationSounds();
    setSoundEnabled(isNotificationSoundEnabled());
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [searchTerm, sortBy, sortDirection, currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewRecord = (record: CVRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
    setUploadStatus('idle');
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    setUploadStatus('completed');
    fetchRecords(); // Refresh the records after successful upload
    
    // Reset status after 3 seconds to allow quicker subsequent uploads
    setTimeout(() => {
      setUploadStatus('idle');
    }, 3000);
  };

  const handleUploadStart = () => {
    setUploadStatus('uploading');
  };

  const handleRefresh = () => {
    fetchRecords();
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    enableNotificationSounds(newState);
    playToggleSound();
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    playClickSound();
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here if needed
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };



  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={handleToggleSidebar}
        currentSection="dashboard"
      />
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleToggleSidebar}
                variant="outline"
                size="sm"
                className="sm:hidden flex items-center gap-2 border-slate-300 hover:border-blue-500 hover:text-blue-600"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="hidden sm:block text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CV Manager</h1>
                  <p className="hidden sm:block text-xs text-slate-500">Intelligent Resume Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="hidden sm:flex shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-slate-300 hover:border-blue-500 hover:text-blue-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleToggleSound}
                onMouseEnter={playHoverSound}
                variant="outline"
                size="sm"
                className={`hidden sm:flex shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-slate-300 p-2 ${
                  soundEnabled 
                    ? 'hover:border-blue-500 hover:text-blue-600 text-blue-600 border-blue-300' 
                    : 'hover:border-red-500 hover:text-red-600 text-red-600 border-red-300'
                }`}
                title={soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
              <NotificationBell />
              <Button 
                onClick={handleOpenUploadModal}
                disabled={false}
                className={`shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                  uploadStatus === 'completed' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                    : uploadStatus === 'uploading'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } text-white`}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload Another
                  </>
                ) : uploadStatus === 'completed' ? (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload More
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-indigo-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Total CVs</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{totalRecords}</div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                Candidates in database
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-gradient-to-br from-white to-emerald-50 hover:from-emerald-50 hover:to-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-emerald-600 transition-colors">Recent Uploads</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {records.filter(r => {
                  const uploadDate = new Date(r.uploadDate);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return uploadDate > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2"></span>
                This week
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-purple-600 transition-colors">Processing Status</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 group-hover:text-purple-600 transition-colors flex items-center">
                Active
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></div>
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <span className="w-1 h-1 bg-purple-500 rounded-full mr-2"></span>
                System operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="bg-transparent rounded-t-lg">
            <CardTitle className="text-lg text-slate-800 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filter
            </CardTitle>
            <CardDescription className="text-slate-600">
              Find candidates quickly with advanced search and sorting options
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search by name, email, university, or skills..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-200"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-slate-300 bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploadDate">📅 Upload Date</SelectItem>
                    <SelectItem value="firstName">👤 First Name</SelectItem>
                    <SelectItem value="lastName">👤 Last Name</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CV Records Table */}
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  CV Records
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  {totalRecords} total candidates • {records.length} displayed
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {loading ? 'Loading...' : 'Ready'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => handleSort('firstName')}
                      >
                        Name {sortBy === 'firstName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortBy === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>University</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                        <TableCell>
                          <button
                            onClick={() => handleViewRecord(record)}
                            className="text-left hover:text-blue-600 hover:underline transition-all duration-200 cursor-pointer bg-transparent border-none p-0 font-medium group-hover:font-semibold flex items-center"
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-3 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                              <span className="text-sm font-semibold text-blue-600">
                                {record.firstName.charAt(0)}{record.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                {record.firstName} {record.lastName}
                              </div>
                              <div className="text-xs text-slate-500 group-hover:text-blue-500 transition-colors">
                                Click to view details
                              </div>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="text-slate-600 group-hover:text-slate-800 transition-colors">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {record.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.universities && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 hover:from-purple-200 hover:to-pink-200 transition-all duration-200">
                              {truncateText(record.universities, 30)}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {records.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No CVs found</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                      {searchTerm ? 'Try adjusting your search terms or filters to find what you\'re looking for.' : 'Get started by uploading your first CV to begin building your candidate database.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CV
                      </Button>
                      {searchTerm && (
                        <Button 
                          variant="outline"
                          onClick={() => handleSearch('')}
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Total Records Display */}
            <div className="flex items-center justify-center mt-6">
              <div className="text-sm text-gray-500">
                Showing all {totalRecords} records
              </div>
            </div>
            
            {/* Pagination - Hidden since showing all records */}
            {false && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* CV Details Modal */}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedRecord ? `${selectedRecord.firstName} ${selectedRecord.lastName}` : ''}
            description={selectedRecord?.email}
            size="2xl"
          >
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Information */}
               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                   <Users className="w-5 h-5 mr-2 text-blue-600" />
                   Basic Information
                 </h3>
                 <div className="grid grid-cols-1 gap-4">
                   <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <span className="text-sm font-medium text-blue-600 block mb-1">Email</span>
                      <a 
                        href={`mailto:${selectedRecord.email}`}
                        className="text-blue-600 hover:text-blue-800 break-all text-sm underline hover:no-underline transition-colors cursor-pointer"
                        title={`Send email to ${selectedRecord.email}`}
                      >
                        {selectedRecord.email}
                      </a>
                    </div>
                   {selectedRecord.universities && (
                     <div className="bg-white rounded-lg p-4 border border-blue-100">
                       <span className="text-sm font-medium text-blue-600 block mb-1">University</span>
                       <span className="text-gray-900 leading-relaxed text-sm">{selectedRecord.universities}</span>
                     </div>
                   )}
                 </div>
               </div>

              {/* CV Document */}
              {selectedRecord.cvUrl && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-green-600" />
                    CV Document
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <span className="text-gray-900 font-medium block">CV Document</span>
                          <span className="text-gray-500 text-sm">Click to view or copy URL</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCopyToClipboard(selectedRecord.cvUrl, 'CV URL')}
                          className="px-3 py-1 text-sm border border-green-200 text-green-600 hover:bg-green-100 rounded transition-colors flex items-center"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </button>
                        <button
                          onClick={() => window.open(selectedRecord.cvUrl, '_blank')}
                          className="px-3 py-1 text-sm border border-green-200 text-green-600 hover:bg-green-100 rounded transition-colors flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View CV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Summary */}
              {selectedRecord.resumeSummary && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Resume Summary
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.resumeSummary, 'Resume Summary')}
                      className="px-3 py-2 text-sm border border-purple-200 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.resumeSummary}
                  </div>
                </div>
              )}

              {/* Interview Questions */}
              {selectedRecord.interviewQuestions && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-amber-800 flex items-center">
                      <Search className="w-5 h-5 mr-2 text-amber-600" />
                      Interview Questions
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.interviewQuestions, 'Interview Questions')}
                      className="px-3 py-2 text-sm border border-amber-200 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-amber-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.interviewQuestions}
                  </div>
                </div>
              )}

              {/* Detected Gaps */}
              {selectedRecord.detectedGaps && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                      Detected Gaps
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.detectedGaps, 'Detected Gaps')}
                      className="px-3 py-2 text-sm border border-orange-200 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-orange-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.detectedGaps}
                  </div>
                </div>
              )}

              {/* Holder Summary */}
              {selectedRecord.holderSummary && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-teal-800 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-teal-600" />
                      Holder Summary
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.holderSummary, 'Holder Summary')}
                      className="px-3 py-2 text-sm border border-teal-200 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-teal-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.holderSummary}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <Modal isOpen={isUploadModalOpen} onClose={handleCloseUploadModal} title="Upload CV">
          <CVUpload 
            onSuccess={handleUploadSuccess} 
            onClose={handleCloseUploadModal}
            onUploadStart={handleUploadStart}
          />
        </Modal>
      )}
    </div>
  );
};

export default CVDashboard;