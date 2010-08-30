<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:regexp="http://exslt.org/regular-expressions"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="regexp">

  <xsl:output method="xml"
	encoding="utf-8"
	omit-xml-declaration="no"
	indent="no"
	media-type="application/xhtml+xml" />

  <xsl:template match="statuses[status]">
	<body>
	  <xsl:apply-templates select="status" />
	</body>
  </xsl:template>

  <xsl:template match="status">
	<xsl:choose>
	  <xsl:when test="retweeted_status">
		<xsl:call-template name="status">
		  <xsl:with-param name="cur" select="retweeted_status" />
		</xsl:call-template>
	  </xsl:when>
	  <xsl:otherwise>
		<xsl:call-template name="status" />
	  </xsl:otherwise>
	</xsl:choose>
  </xsl:template>

  <xsl:template name="status">
	<xsl:param name="cur" select="." />
	<section title="{$cur/id}">
	  <xsl:attribute name="class">
		<xsl:choose>
		  <xsl:when test="$cur/user/protected = 'true'">protected</xsl:when>
		  <xsl:when test="local-name($cur) = 'retweeted_status'">retweeted</xsl:when>
		  <xsl:otherwise />
		</xsl:choose>
	  </xsl:attribute>
	  <img src="{regexp:replace($cur/user/profile_image_url, '^(.+_)normal(\..+)$', '', '$1mini$2')}" alt="" />
	  <div class="meta">
		<header>
		  <h1><xsl:value-of select="$cur/user/screen_name" /></h1>
		</header>
		<footer>
		  <time><xsl:value-of select="$cur/created_at" /></time>
		  <xsl:text>via </xsl:text>
		  <em class="source">
			<xsl:value-of select="regexp:replace($cur/source, '^&lt;a [^&gt;]+&gt;(.+)&lt;/a&gt;$', '', '$1')" />
		  </em>
		</footer>
	  </div>
	  <p>
		<xsl:if test="$cur/favorited = 'true'">
		  <xsl:attribute name="class">favorited</xsl:attribute>
		</xsl:if>
		<xsl:value-of select="$cur/text" />
	  </p>
	</section>
  </xsl:template>

</xsl:stylesheet>
