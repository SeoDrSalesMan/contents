# 🚀 EasyPanel Deployment Guide

## Prerequisites

- EasyPanel account and access
- GitHub repository connected to EasyPanel
- Repository: `https://github.com/SeoDrSalesMan/contents`

## 📋 Deployment Configuration

### 1. Project Setup in EasyPanel

1. **Login to EasyPanel**
2. **Create New Project** or select existing
3. **Connect Repository**:
   - Repository URL: `https://github.com/SeoDrSalesMan/contents`
   - Branch: `main`
   - Auto-deploy: `true` (recommended)

### 2. Build Configuration

**Build Method**: `Dockerfile`
**Dockerfile Path**: `./Dockerfile`
**Build Context**: `.` (root directory)

### 3. Environment Variables

Set the following environment variables in EasyPanel:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

### 4. Port Configuration

**Container Port**: `3000`
**External Port**: Choose available port (default: 3000)

### 5. Health Check Configuration

**Health Check Path**: `/api/health`
**Health Check Interval**: `30s`
**Health Check Timeout**: `10s`
**Health Check Retries**: `3`

## 🔧 Advanced Configuration

### Resource Limits (Optional)

```yaml
# Memory limit
memory: 512MB

# CPU limit
cpu: 0.5

# Storage
storage: 1GB
```

### Custom Domain (Optional)

1. Go to **Domains** section in EasyPanel
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL certificate (Let's Encrypt)

## 🚀 Deployment Steps

1. **Save Configuration** in EasyPanel
2. **Trigger Deployment** (automatic on push to main)
3. **Monitor Build Logs** in EasyPanel dashboard
4. **Check Health Status** at `/api/health` endpoint
5. **Access Application** at your configured domain/port

## 📊 Monitoring & Maintenance

### Health Checks
- **Endpoint**: `https://your-domain.com/api/health`
- **Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T05:53:33.000Z",
  "service": "content-generator",
  "version": "1.0.0"
}
```

### Logs
- **Application Logs**: Available in EasyPanel dashboard
- **Build Logs**: View deployment history and logs
- **Error Monitoring**: Check container status and restart if needed

### Updates
- **Automatic**: Push to `main` branch triggers auto-deployment
- **Manual**: Use EasyPanel dashboard to trigger manual deployment
- **Rollback**: EasyPanel supports deployment rollback

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in EasyPanel
   - Verify all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Health Check Failures**
   - Verify `/api/health` endpoint is responding
   - Check container resource usage
   - Review application logs for errors

3. **Application Errors**
   - Check browser console for client-side errors
   - Review server logs in EasyPanel
   - Verify environment variables are set correctly

### Performance Optimization

1. **Enable Caching**
   - Configure CDN if available
   - Set appropriate cache headers

2. **Resource Monitoring**
   - Monitor CPU and memory usage
   - Scale resources as needed

3. **Database Connections**
   - Ensure proper connection pooling
   - Monitor connection limits

## 📞 Support

For EasyPanel-specific issues:
- Check EasyPanel documentation
- Contact EasyPanel support
- Review deployment logs for detailed error messages

## ✅ Success Checklist

- [ ] EasyPanel project created
- [ ] GitHub repository connected
- [ ] Dockerfile configuration applied
- [ ] Environment variables set
- [ ] Port configuration correct
- [ ] Health check configured
- [ ] Deployment successful
- [ ] Application accessible
- [ ] Health endpoint responding
- [ ] n8n webhooks functional
